import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OzowPaymentService } from '@/lib/ozow';
import { notifyPaymentReceived, notifyAdminFeeRequired } from '@/lib/notifications-extended';

// Create Supabase client lazily to avoid build errors
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

/**
 * Ozow Payment Webhook Callback
 * This endpoint is called by Ozow after payment is processed
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Ozow callback received:', data);

    const ozow = new OzowPaymentService();

    // Verify webhook hash
    if (!ozow.verifyWebhookHash(data)) {
      console.error('Ozow callback hash verification failed');
      return NextResponse.json(
        { message: 'Hash verification failed' },
        { status: 401 }
      );
    }

    const { Status, TransactionReference, BankReference } = data;

    // Update payment record based on status
    if (Status === 'Abandoned') {
      await supabase
        .from('payments')
        .update({ status: 'failed', ozow_status: 'Abandoned' })
        .eq('id', TransactionReference);
    } else if (Status === 'Cancelled') {
      await supabase
        .from('payments')
        .update({ status: 'failed', ozow_status: 'Cancelled' })
        .eq('id', TransactionReference);
    } else if (Status === 'Completed') {
      // Payment successful
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          ozow_status: 'Completed',
          ozow_reference: BankReference,
        })
        .eq('id', TransactionReference)
        .select()
        .single();

      if (!paymentError && payment) {
        // Notify landlord of payment received
        try {
          await notifyPaymentReceived(
            payment.landlord_id,
            payment.amount,
            payment.property_id
          );
        } catch (notifyError) {
          console.error('Error sending payment notification:', notifyError);
        }

        // If this is a lease move-in payment and both parties have signed, trigger admin fee
        if (payment.lease_id) {
          const { data: lease } = await supabase
            .from('leases')
            .select('signed_by_landlord, signed_by_tenant, landlord_id')
            .eq('id', payment.lease_id)
            .single();

          if (lease && lease.signed_by_landlord && lease.signed_by_tenant) {
            // Trigger admin fee notification
            try {
              await notifyAdminFeeRequired(lease.landlord_id);
            } catch (adminFeeError) {
              console.error('Error sending admin fee notification:', adminFeeError);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Ozow callback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
