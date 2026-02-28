// Messaging unlock helper functions
import { supabase } from '@/lib/supabase';

export type MessageUnlockReason = 
  | 'application_approved' 
  | 'lease_signed' 
  | 'initial_inquiry'
  | 'locked';

/**
 * Checks if tenant can message landlord
 * Unlocked conditions:
 * 1. Tenant has approved application for landlord's property
 * 2. Tenant has signed lease with landlord
 * 3. Landlord initiated contact
 */
export async function canTenantMessageLandlord(
  tenantId: string,
  landlordId: string
): Promise<{ canMessage: boolean; reason: MessageUnlockReason }> {
  try {
    // Check if there's a signed lease
    const { data: leaseData } = await supabase
      .from('leases')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('landlord_id', landlordId)
      .eq('signed_by_tenant', true)
      .eq('signed_by_landlord', true)
      .limit(1)
      .single();

    if (leaseData) {
      return { canMessage: true, reason: 'lease_signed' };
    }

    // Check if there's an approved application
    const { data: appData } = await supabase
      .from('applications')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'approved')
      .eq('property_id', (await getPropertyIdForLandlord(landlordId)) || '')
      .limit(1)
      .single();

    if (appData) {
      return { canMessage: true, reason: 'application_approved' };
    }

    // Check if landlord already initiated contact
    const { data: messageData } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', landlordId)
      .eq('recipient_id', tenantId)
      .limit(1)
      .single();

    if (messageData) {
      return { canMessage: true, reason: 'initial_inquiry' };
    }

    return { canMessage: false, reason: 'locked' };
  } catch (error) {
    console.error('Error checking message unlock:', error);
    return { canMessage: false, reason: 'locked' };
  }
}

/**
 * Checks if landlord can message tenant
 * Landlords can always initiate
 */
export async function canLandlordMessageTenant(
  landlordId: string,
  tenantId: string
): Promise<boolean> {
  // Landlords can always send first message
  return true;
}

/**
 * Get all valid conversation partners for a tenant
 */
export async function getTenantMessageableContacts(tenantId: string): Promise<string[]> {
  try {
    // Get landlord IDs from approved applications
    const { data: approvedApps } = await supabase
      .from('applications')
      .select('property_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'approved');

    const { data: properties } = await supabase
      .from('properties')
      .select('landlord_id')
      .in(
        'id',
        (approvedApps || []).map(a => a.property_id).filter(Boolean)
      );

    // Get landlord IDs from signed leases
    const { data: leases } = await supabase
      .from('leases')
      .select('landlord_id')
      .eq('tenant_id', tenantId)
      .eq('signed_by_tenant', true)
      .eq('signed_by_landlord', true);

    // Get landlord IDs who have messaged tenant
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('recipient_id', tenantId)
      .distinct();

    const landlordIdSet = new Set<string>();
    
    (properties || []).forEach(p => {
      if (p.landlord_id) landlordIdSet.add(p.landlord_id);
    });
    
    (leases || []).forEach(l => {
      if (l.landlord_id) landlordIdSet.add(l.landlord_id);
    });
    
    (messages || []).forEach(m => {
      if (m.sender_id) landlordIdSet.add(m.sender_id);
    });

    return Array.from(landlordIdSet);
  } catch (error) {
    console.error('Error getting messageable contacts:', error);
    return [];
  }
}

/**
 * Get property ID for a landlord (helper)
 */
async function getPropertyIdForLandlord(landlordId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('properties')
      .select('id')
      .eq('landlord_id', landlordId)
      .limit(1)
      .single();
    return data?.id || null;
  } catch {
    return null;
  }
}

/**
 * Auto-unlock messaging after lease is fully signed
 */
export async function unlockMessagingAfterLeaseSigned(leaseId: string): Promise<void> {
  try {
    // This function can be called from the lease signing flow
    // The actual unlock happens through RLS policies checking lease status
    console.log('Messaging will be unlocked for signed lease:', leaseId);
    // No additional action needed - RLS policies handle this
  } catch (error) {
    console.error('Error in unlockMessagingAfterLeaseSigned:', error);
  }
}
