import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { SetupIntentRequest, SetupIntentResponse, ApiResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    const body: SetupIntentRequest = await request.json();

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Customer ID is required',
        },
        { status: 400 }
      );
    }

    // Verify customer exists
    try {
      await stripe.customers.retrieve(body.customerId);
    } catch (error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: body.customerId,
      usage: body.usage || 'off_session', // Default to off_session for card on file
      payment_method_types: ['card'],
      metadata: {
        source: 'stripe-testing-app',
        flow: 'setup-card-only',
      },
    });

    const response: SetupIntentResponse = {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('SetupIntent creation error:', error);
    
    let errorMessage = 'Failed to create SetupIntent';
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const setupIntentId = url.searchParams.get('id');

    if (!setupIntentId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'SetupIntent ID is required',
        },
        { status: 400 }
      );
    }

    // Retrieve SetupIntent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: setupIntent,
    });
  } catch (error) {
    console.error('SetupIntent retrieval error:', error);
    
    let errorMessage = 'Failed to retrieve SetupIntent';
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