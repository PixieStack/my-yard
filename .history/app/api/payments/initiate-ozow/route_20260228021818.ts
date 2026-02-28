import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OzowPaymentService } from '@/lib/ozow';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { leaseId, tenantId, amount, description } = await request.json();

    if (!leaseId || !tenantId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get lease and tenant details
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('*, property_id')
      .eq('id', leaseId)
      .eq('tenant_id', tenantId)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json(
        { message: 'Lease not found' },
        { status: 404 }
      );
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, phone')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        lease_id: leaseId,
        tenant_id: tenantId,
        landlord_id: lease.landlord_id,
        property_id: lease.property_id,
        amount: amount,
        payment_type: 'rent',
        status: 'pending',
        payment_method: 'ozow',
      })
      .select()
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { message: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Initialize Ozow service
    const ozow = new OzowPaymentService();

    // Generate Ozow payment request
    const ozowRequest = {
      siteCode: process.env.OZOW_SITE_CODE || '',
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      amount: Math.round(amount * 100), // Convert to cents
      transactionReference: payment.id,
      bankReference: `MYYARD-${leaseId.slice(0, 8)}`,
      customer: tenant.email,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tenant/payments?cancelled=true`,
      errorUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tenant/payments?error=true`,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tenant/payments?success=true&paymentId=${payment.id}`,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/ozow-callback`,
      isTest: process.env.OZOW_IS_TEST === 'true',
    };

    // Generate hash
    const hash = ozow.generateHash(ozowRequest);
    const paymentUrl = ozow.buildPaymentUrl(ozowRequest, hash);

    return NextResponse.json({
      paymentUrl,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error initiating Ozow payment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
