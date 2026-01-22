import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PaymentMethodDataStore, CustomerDataStore } from '@/lib/data';
import { ApiResponse, PaymentMethodsResponse, SavedPaymentMethod } from '@/types/stripe';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const paymentMethodId = url.searchParams.get('id');

    if (paymentMethodId) {
      // Get single payment method
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      const localData = PaymentMethodDataStore.getById(paymentMethodId);
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          stripe: paymentMethod,
          local: localData,
        },
      });
    }

    if (customerId) {
      // First verify customer exists
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error: any) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Customer not found: ${customerId}. Please select a valid customer.`,
          },
          { status: 404 }
        );
      }

      // Get payment methods for a specific customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // Filter out payment methods that might be attached to deleted customers
      const validPaymentMethods = paymentMethods.data.filter(pm => {
        // Verify payment method is still attached to this customer
        const pmCustomerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
        return pmCustomerId === customerId;
      });

      // Also get local data for additional metadata
      const localPaymentMethods = PaymentMethodDataStore.getByCustomerId(customerId);

      return NextResponse.json<ApiResponse<PaymentMethodsResponse>>({
        success: true,
        data: {
          paymentMethods: validPaymentMethods,
          localData: localPaymentMethods,
        },
      });
    }

    // Get all payment methods from local storage
    const localPaymentMethods = PaymentMethodDataStore.getAll();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        localPaymentMethods,
      },
    });
  } catch (error) {
    console.error('Payment methods retrieval error:', error);
    
    let errorMessage = 'Failed to retrieve payment methods';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentMethodId, customerId, isDefault } = body;

    if (!paymentMethodId || !customerId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Payment method ID and customer ID are required',
        },
        { status: 400 }
      );
    }

    // Attach payment method to customer in Stripe
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Create local data entry
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
      created: paymentMethod.created * 1000, // Convert to milliseconds
      isDefault: isDefault || false,
    };

    PaymentMethodDataStore.save(savedPaymentMethod);

    // Set as default if requested
    if (isDefault) {
      PaymentMethodDataStore.setAsDefault(paymentMethodId, customerId);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stripe: paymentMethod,
        local: savedPaymentMethod,
      },
    });
  } catch (error) {
    console.error('Payment method attachment error:', error);
    
    let errorMessage = 'Failed to save payment method';
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
    const body = await request.json();
    const { paymentMethodId, customerId, action } = body;

    if (!paymentMethodId || !customerId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Payment method ID and customer ID are required',
        },
        { status: 400 }
      );
    }

    if (action === 'set_default') {
      // Set payment method as default for customer
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update local data
      PaymentMethodDataStore.setAsDefault(paymentMethodId, customerId);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: 'Payment method set as default' },
      });
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Invalid action. Use "set_default"',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment method update error:', error);
    
    let errorMessage = 'Failed to update payment method';
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentMethodId = url.searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Payment method ID is required',
        },
        { status: 400 }
      );
    }

    // Detach payment method from customer in Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove from local storage
    const deleted = PaymentMethodDataStore.delete(paymentMethodId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('Payment method detachment error:', error);
    
    let errorMessage = 'Failed to remove payment method';
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