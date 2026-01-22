import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CustomerDataStore } from '@/lib/data';
import { CreateCustomerRequest, ApiResponse } from '@/types/stripe';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get('id');

    if (customerId) {
      // Get single customer
      const customer = await stripe.customers.retrieve(customerId);
      const localData = CustomerDataStore.getById(customerId);
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          ...customer,
          localData,
        },
      });
    } else {
      // Get all customers from local storage
      const localCustomers = CustomerDataStore.getAll();
      
      // Fetch from Stripe - get all customers (paginate if needed)
      let allStripeCustomers: any[] = [];
      let hasMore = true;
      let startingAfter: string | undefined = undefined;
      
      try {
        while (hasMore) {
          const params: any = {
            limit: 100, // Maximum per page
          };
          
          if (startingAfter) {
            params.starting_after = startingAfter;
          }
          
          const stripeCustomers = await stripe.customers.list(params);
          allStripeCustomers = [...allStripeCustomers, ...stripeCustomers.data];
          
          hasMore = stripeCustomers.has_more;
          if (hasMore && stripeCustomers.data.length > 0) {
            startingAfter = stripeCustomers.data[stripeCustomers.data.length - 1].id;
          } else {
            hasMore = false;
          }
          
          // Safety limit - don't fetch more than 1000 customers
          if (allStripeCustomers.length >= 1000) {
            hasMore = false;
          }
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe customers:', stripeError);
        // Return empty array if Stripe fetch fails
        allStripeCustomers = [];
      }

      // Return empty list if no customers found
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          localCustomers: localCustomers.length > 0 ? localCustomers : [],
          stripeCustomers: allStripeCustomers,
          totalCount: allStripeCustomers.length,
        },
      });
    }
  } catch (error) {
    console.error('Customer API error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerRequest = await request.json();
    
    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Email and name are required',
        },
        { status: 400 }
      );
    }

    // Check if customer already exists locally
    const existingCustomer = CustomerDataStore.getByEmail(body.email);
    if (existingCustomer) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: existingCustomer,
      });
    }

    // Create customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: body.email,
      name: body.name,
      metadata: {
        source: 'stripe-testing-app',
        ...body.metadata,
      },
    });

    // Save customer data locally
    const customerData = {
      id: stripeCustomer.id,
      email: stripeCustomer.email!,
      name: stripeCustomer.name!,
      created: stripeCustomer.created * 1000, // Convert to milliseconds
      paymentMethods: [],
    };

    CustomerDataStore.save(customerData);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stripe: stripeCustomer,
        local: customerData,
      },
    });
  } catch (error) {
    console.error('Customer creation error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get('id');

    if (!customerId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Customer ID is required',
        },
        { status: 400 }
      );
    }

    // Delete from Stripe (this will mark as deleted, not actually remove)
    await stripe.customers.del(customerId);

    // Remove from local storage
    const deleted = CustomerDataStore.delete(customerId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('Customer deletion error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer',
      },
      { status: 500 }
    );
  }
}