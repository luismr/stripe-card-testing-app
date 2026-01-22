import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { PaymentIntentRequest, PaymentIntentResponse, ApiResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentRequest = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Valid amount is required',
        },
        { status: 400 }
      );
    }

    // Prepare PaymentIntent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(body.amount * 100), // Convert to cents
      currency: body.currency || 'usd',
      payment_method_types: ['card'],
      metadata: {
        source: 'stripe-testing-app',
        save_card: body.saveCard ? 'true' : 'false',
        off_session: body.offSession ? 'true' : 'false',
      },
    };

    // Add customer if provided
    if (body.customerId) {
      // Verify customer exists
      try {
        const customer = await stripe.customers.retrieve(body.customerId);
        // Check if customer is deleted
        if (customer.deleted) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: `Customer ${body.customerId} has been deleted. Please select a different customer.`,
            },
            { status: 404 }
          );
        }
        paymentIntentParams.customer = body.customerId;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Customer not found';
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: errorMessage.includes('No such customer') 
              ? `Customer ${body.customerId} not found in your Stripe account. Please select a valid customer.`
              : errorMessage,
          },
          { status: 404 }
        );
      }
    }

    // Add payment method if provided (for saved card payments)
    if (body.paymentMethodId) {
      // Verify payment method exists and is attached to the customer
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(body.paymentMethodId);
        
        // If customer is provided, verify payment method belongs to that customer
        if (body.customerId) {
          const pmCustomerId = typeof paymentMethod.customer === 'string' 
            ? paymentMethod.customer 
            : paymentMethod.customer?.id;
          
          if (pmCustomerId !== body.customerId) {
            return NextResponse.json<ApiResponse>(
              {
                success: false,
                error: `Payment method ${body.paymentMethodId} is not attached to customer ${body.customerId}. Please select a payment method for this customer.`,
              },
              { status: 400 }
            );
          }
        }
        
        paymentIntentParams.payment_method = body.paymentMethodId;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment method not found';
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: errorMessage.includes('No such payment_method')
              ? `Payment method ${body.paymentMethodId} not found. Please refresh payment methods.`
              : errorMessage,
          },
          { status: 404 }
        );
      }
      
      // For off-session payments, confirm immediately
      if (body.offSession) {
        paymentIntentParams.confirm = true;
        paymentIntentParams.off_session = true;
      }
    }

    // Setup future usage if saving card
    if (body.saveCard && body.customerId) {
      paymentIntentParams.setup_future_usage = 'off_session';
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    const response: PaymentIntentResponse = {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };

    // Add client secret if not automatically confirmed
    if (paymentIntent.status === 'requires_payment_method' || 
        paymentIntent.status === 'requires_confirmation') {
      response.clientSecret = paymentIntent.client_secret || undefined;
    }

    // Check if additional action is required (3DS, etc.)
    if (paymentIntent.status === 'requires_action') {
      response.requiresAction = true;
      response.clientSecret = paymentIntent.client_secret || undefined;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('PaymentIntent creation error:', error);
    
    let errorMessage = 'Failed to create PaymentIntent';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Stripe errors
      if (error.message.includes('authentication_required')) {
        statusCode = 402; // Payment required
      } else if (error.message.includes('card_declined')) {
        statusCode = 402;
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentIntentId = url.searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'PaymentIntent ID is required',
        },
        { status: 400 }
      );
    }

    // Retrieve PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('PaymentIntent retrieval error:', error);
    
    let errorMessage = 'Failed to retrieve PaymentIntent';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentIntentId = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!paymentIntentId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'PaymentIntent ID is required',
        },
        { status: 400 }
      );
    }

    let paymentIntent;

    if (action === 'confirm') {
      // Confirm PaymentIntent (useful for off-session payments)
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    } else if (action === 'cancel') {
      // Cancel PaymentIntent
      paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid action. Use "confirm" or "cancel"',
        },
        { status: 400 }
      );
    }

    const response: PaymentIntentResponse = {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };

    // Add client secret if needed for further actions
    if (paymentIntent.status === 'requires_action') {
      response.requiresAction = true;
      response.clientSecret = paymentIntent.client_secret || undefined;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('PaymentIntent update error:', error);
    
    let errorMessage = 'Failed to update PaymentIntent';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}