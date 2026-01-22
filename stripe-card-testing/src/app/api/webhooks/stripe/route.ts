import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, constructWebhookEvent } from '@/lib/stripe';
import { PaymentMethodDataStore, CustomerDataStore } from '@/lib/data';
import { SavedPaymentMethod } from '@/types/stripe';
import Stripe from 'stripe';

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(
      Buffer.from(body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful SetupIntent (card saved without payment)
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  console.log('SetupIntent succeeded:', setupIntent.id);

  if (setupIntent.payment_method && setupIntent.customer) {
    const paymentMethodId = typeof setupIntent.payment_method === 'string' 
      ? setupIntent.payment_method 
      : setupIntent.payment_method.id;

    const customerId = typeof setupIntent.customer === 'string'
      ? setupIntent.customer
      : setupIntent.customer.id;

    try {
      // Fetch payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Save to local storage
      const savedPaymentMethod: SavedPaymentMethod = {
        id: paymentMethod.id,
        customerId: customerId,
        type: 'card',
        card: {
          brand: paymentMethod.card?.brand || 'unknown',
          last4: paymentMethod.card?.last4 || '0000',
          exp_month: paymentMethod.card?.exp_month || 1,
          exp_year: paymentMethod.card?.exp_year || new Date().getFullYear(),
        },
        created: paymentMethod.created * 1000,
        isDefault: false,
      };

      PaymentMethodDataStore.save(savedPaymentMethod);
      console.log('Saved payment method from SetupIntent:', paymentMethod.id);
    } catch (error) {
      console.error('Error processing SetupIntent payment method:', error);
    }
  }
}

// Handle successful PaymentIntent
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent succeeded:', paymentIntent.id);

  // If this payment intent has setup_future_usage, save the payment method
  if (paymentIntent.setup_future_usage && 
      paymentIntent.payment_method && 
      paymentIntent.customer) {
    
    const paymentMethodId = typeof paymentIntent.payment_method === 'string'
      ? paymentIntent.payment_method
      : paymentIntent.payment_method.id;

    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer.id;

    try {
      // Fetch payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Save to local storage
      const savedPaymentMethod: SavedPaymentMethod = {
        id: paymentMethod.id,
        customerId: customerId,
        type: 'card',
        card: {
          brand: paymentMethod.card?.brand || 'unknown',
          last4: paymentMethod.card?.last4 || '0000',
          exp_month: paymentMethod.card?.exp_month || 1,
          exp_year: paymentMethod.card?.exp_year || new Date().getFullYear(),
        },
        created: paymentMethod.created * 1000,
        isDefault: false,
      };

      PaymentMethodDataStore.save(savedPaymentMethod);
      console.log('Saved payment method from PaymentIntent:', paymentMethod.id);
    } catch (error) {
      console.error('Error processing PaymentIntent payment method:', error);
    }
  }

  // Log payment success for testing purposes
  const amount = paymentIntent.amount;
  const currency = paymentIntent.currency;
  console.log(`Payment completed: ${amount / 100} ${currency.toUpperCase()}`);
}

// Handle failed PaymentIntent
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent failed:', paymentIntent.id);
  
  const lastError = paymentIntent.last_payment_error;
  console.log('Failure reason:', lastError?.message || 'Unknown error');
  
  // In a real app, you might:
  // - Update subscription status
  // - Send notification to customer
  // - Trigger retry logic
  // - Log for analytics
}

// Handle payment method attachment
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('PaymentMethod attached:', paymentMethod.id);

  if (paymentMethod.customer) {
    const customerId = typeof paymentMethod.customer === 'string'
      ? paymentMethod.customer
      : paymentMethod.customer.id;

    const savedPaymentMethod: SavedPaymentMethod = {
      id: paymentMethod.id,
      customerId: customerId,
      type: 'card',
      card: {
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '0000',
        exp_month: paymentMethod.card?.exp_month || 1,
        exp_year: paymentMethod.card?.exp_year || new Date().getFullYear(),
      },
      created: paymentMethod.created * 1000,
      isDefault: false,
    };

    PaymentMethodDataStore.save(savedPaymentMethod);
    console.log('Saved attached payment method:', paymentMethod.id);
  }
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);

  const customerData = {
    id: customer.id,
    email: customer.email || '',
    name: customer.name || '',
    created: customer.created * 1000,
    paymentMethods: [],
  };

  CustomerDataStore.save(customerData);
  console.log('Saved customer data:', customer.id);
}

// Handle customer deletion
async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Customer deleted:', customer.id);
  
  CustomerDataStore.delete(customer.id);
  
  // Also remove all payment methods for this customer
  const customerPaymentMethods = PaymentMethodDataStore.getByCustomerId(customer.id);
  customerPaymentMethods.forEach(pm => {
    PaymentMethodDataStore.delete(pm.id);
  });
  
  console.log('Cleaned up customer data:', customer.id);
}

// GET endpoint to test webhook endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
    events_handled: [
      'setup_intent.succeeded',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_method.attached',
      'customer.created',
      'customer.deleted',
    ],
  });
}