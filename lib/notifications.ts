import { supabase } from "@/lib/supabase"

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: "application" | "payment" | "maintenance" | "viewing" | "lease" | "message"
  actionUrl?: string
}

export async function createNotification({ userId, title, message, type, actionUrl }: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Helper functions for common notification types
export async function notifyNewApplication(
  landlordId: string,
  tenantName: string,
  propertyTitle: string,
  applicationId: string,
) {
  return createNotification({
    userId: landlordId,
    title: "New Application Received",
    message: `${tenantName} has applied for ${propertyTitle}`,
    type: "application",
    actionUrl: `/landlord/applications/${applicationId}`,
  })
}

export async function notifyApplicationApproved(tenantId: string, propertyTitle: string, applicationId: string) {
  return createNotification({
    userId: tenantId,
    title: "Application Approved!",
    message: `Congratulations! Your application for ${propertyTitle} has been approved.`,
    type: "lease",
    actionUrl: `/tenant/applications/${applicationId}`,
  })
}

export async function notifyApplicationRejected(tenantId: string, propertyTitle: string, applicationId: string) {
  return createNotification({
    userId: tenantId,
    title: "Application Update",
    message: `Your application for ${propertyTitle} has been declined.`,
    type: "application",
    actionUrl: `/tenant/applications/${applicationId}`,
  })
}

export async function notifyViewingRequested(
  tenantId: string,
  propertyTitle: string,
  viewingDate: string,
  applicationId: string,
) {
  return createNotification({
    userId: tenantId,
    title: "Viewing Requested",
    message: `A viewing has been requested for ${propertyTitle} on ${viewingDate}`,
    type: "viewing",
    actionUrl: `/tenant/applications/${applicationId}`,
  })
}

export async function notifyPaymentRequest(tenantId: string, amount: number, dueDate: string, paymentType: string) {
  return createNotification({
    userId: tenantId,
    title: "Payment Request",
    message: `Payment of R${amount.toLocaleString()} for ${paymentType} is due on ${dueDate}`,
    type: "payment",
    actionUrl: "/tenant/payments",
  })
}

export async function notifyNewMessage(recipientId: string, senderName: string, subject: string) {
  return createNotification({
    userId: recipientId,
    title: "New Message",
    message: `${senderName}: ${subject}`,
    type: "message",
    actionUrl: "/tenant/messages",
  })
}

export async function notifyMaintenanceRequest(
  landlordId: string,
  tenantName: string,
  propertyTitle: string,
  issue: string,
) {
  return createNotification({
    userId: landlordId,
    title: "Maintenance Request",
    message: `${tenantName} reported: ${issue} at ${propertyTitle}`,
    type: "maintenance",
    actionUrl: "/landlord/maintenance",
  })
}
