'use client';

import { supabase } from './supabase';

export type NotificationType = 
  | 'application'
  | 'payment'
  | 'maintenance'
  | 'viewing'
  | 'lease'
  | 'message'
  | 'admin_fee';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  options: {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
  }
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title: options.title,
      message: options.message,
      type: options.type,
      action_url: options.actionUrl,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return true;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Notification[];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking all as read:', err);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
}

// ─── Specific Notification Creators ──────────────────────────────────────────

/**
 * Notify tenant that viewing was confirmed
 */
export async function notifyViewingConfirmed(
  tenantId: string,
  propertyTitle: string,
  confirmedDate: string,
  confirmedTime: string
) {
  return createNotification(tenantId, {
    title: 'Viewing Confirmed',
    message: `Your viewing for ${propertyTitle} has been confirmed for ${confirmedDate} at ${confirmedTime}`,
    type: 'viewing',
    actionUrl: '/tenant/applications',
  });
}

/**
 * Notify landlord of new viewing request
 */
export async function notifyViewingRequested(
  landlordId: string,
  propertyTitle: string,
  tenantName: string
) {
  return createNotification(landlordId, {
    title: 'New Viewing Request',
    message: `${tenantName} has requested a viewing for ${propertyTitle}`,
    type: 'viewing',
    actionUrl: '/landlord/viewing-requests',
  });
}

/**
 * Notify tenant that viewing was completed
 */
export async function notifyViewingCompleted(tenantId: string, propertyTitle: string) {
  return createNotification(tenantId, {
    title: 'Viewing Completed',
    message: `Your viewing for ${propertyTitle} has been marked as completed. You can now submit an application.`,
    type: 'viewing',
    actionUrl: '/tenant/applications',
  });
}

/**
 * Notify tenant that application was approved
 */
export async function notifyApplicationApproved(
  tenantId: string,
  propertyTitle: string
) {
  return createNotification(tenantId, {
    title: 'Application Approved!',
    message: `Your application for ${propertyTitle} has been approved. A lease is being prepared.`,
    type: 'application',
    actionUrl: '/tenant/leases',
  });
}

/**
 * Notify tenant that application was rejected
 */
export async function notifyApplicationRejected(
  tenantId: string,
  propertyTitle: string,
  reason?: string
) {
  return createNotification(tenantId, {
    title: 'Application Not Approved',
    message: reason
      ? `Your application for ${propertyTitle} was not approved. Reason: ${reason}`
      : `Your application for ${propertyTitle} was not approved.`,
    type: 'application',
    actionUrl: '/tenant/applications',
  });
}

/**
 * Notify tenant that lease is ready to sign
 */
export async function notifyLeaseReady(tenantId: string, propertyTitle: string) {
  return createNotification(tenantId, {
    title: 'Lease Ready for Signature',
    message: `Your lease for ${propertyTitle} is ready. Please review and sign it.`,
    type: 'lease',
    actionUrl: '/tenant/leases',
  });
}

/**
 * Notify landlord of payment received
 */
export async function notifyPaymentReceived(
  landlordId: string,
  amount: number,
  propertyId?: string
) {
  return createNotification(landlordId, {
    title: 'Payment Received',
    message: `You have received a payment of R${amount.toFixed(2)}`,
    type: 'payment',
    actionUrl: '/landlord/payments',
  });
}

/**
 * Notify landlord to pay admin fee
 */
export async function notifyAdminFeeRequired(landlordId: string, amount: number = 375) {
  return createNotification(landlordId, {
    title: 'Admin Fee Payment Required',
    message: `A lease has been successfully signed. Please pay the admin fee of R${amount.toFixed(2)}.`,
    type: 'admin_fee',
    actionUrl: '/landlord/payments',
  });
}

/**
 * Notify tenant of new message
 */
export async function notifyNewMessage(
  tenantId: string,
  senderName: string,
  propertyTitle: string
) {
  return createNotification(tenantId, {
    title: 'New Message',
    message: `${senderName} sent you a message about ${propertyTitle}`,
    type: 'message',
    actionUrl: '/tenant/messages',
  });
}

/**
 * Notify landlord of new message
 */
export async function notifyLandlordNewMessage(
  landlordId: string,
  senderName: string,
  propertyTitle: string
) {
  return createNotification(landlordId, {
    title: 'New Message',
    message: `${senderName} sent you a message about ${propertyTitle}`,
    type: 'message',
    actionUrl: '/landlord/messages',
  });
}
