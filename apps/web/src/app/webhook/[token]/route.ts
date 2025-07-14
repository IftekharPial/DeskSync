import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dailysync/database';
import { sendSlackNotification, sendBookingSlackNotification } from '@/lib/slack';
import { WebhookLogger } from '@/lib/webhook-logger';
import { TemplateProcessor } from '@/lib/template-processor';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP
const REQUEST_SIZE_LIMIT = 1024 * 1024; // 1MB max request size

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface WebhookPayload {
  meeting_id: string;
  title: string;
  start_time: string;
  end_time: string;
  participants: Array<{
    name: string;
    email: string;
  }>;
  summary: string;
}

interface BookingWebhookPayload {
  booking: {
    id: number;
    hash: string;
    host_user_id: string;
    person_user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    message: string;
    start_time: string;
    end_time: string;
    location_details: {
      online_platform_link?: string;
    };
  };
  calendar_event?: any;
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `webhook_${ip}`;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  existing.count++;
  return true;
}

// Security headers function
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  let payloadLogId: string | undefined;

  try {
    const { token } = params;

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
        { status: 429 }
      );
      return addSecurityHeaders(response);
    }

    // Check request size (approximate)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > REQUEST_SIZE_LIMIT) {
      const response = NextResponse.json(
        { error: 'Request payload too large. Maximum size is 1MB.' },
        { status: 413 }
      );
      return addSecurityHeaders(response);
    }
    
    // Find webhook by URL token
    const webhook = await prisma.incomingWebhook.findFirst({
      where: {
        url: `/webhook/${token}`,
        status: 'ACTIVE'
      },
      include: {
        outgoingEndpoints: {
          where: {
            isActive: true
          },
          include: {
            messageTemplate: true
          }
        }
      }
    });

    if (!webhook) {
      const response = NextResponse.json(
        { error: 'Webhook not found or inactive' },
        { status: 404 }
      );
      return addSecurityHeaders(response);
    }

    // Parse the request body
    const payload: WebhookPayload | BookingWebhookPayload = await request.json();

    // Determine payload type and validate accordingly
    let isBookingPayload = false;
    let processedPayload: any = payload;

    if ('booking' in payload) {
      // This is a booking webhook payload
      isBookingPayload = true;
      const bookingPayload = payload as BookingWebhookPayload;

      // Validate booking required fields
      if (!bookingPayload.booking || !bookingPayload.booking.id ||
          !bookingPayload.booking.first_name || !bookingPayload.booking.email ||
          !bookingPayload.booking.start_time || !bookingPayload.booking.end_time) {
        const response = NextResponse.json(
          { error: 'Missing required booking fields: booking.id, booking.first_name, booking.email, booking.start_time, booking.end_time' },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }

      // Transform booking payload to normalized format for processing
      processedPayload = {
        ...bookingPayload,
        // Add normalized fields for backward compatibility
        meeting_id: `booking_${bookingPayload.booking.id}`,
        title: `Meeting with ${bookingPayload.booking.first_name} ${bookingPayload.booking.last_name}`.trim(),
        start_time: bookingPayload.booking.start_time,
        end_time: bookingPayload.booking.end_time,
        participants: [{
          name: `${bookingPayload.booking.first_name} ${bookingPayload.booking.last_name}`.trim(),
          email: bookingPayload.booking.email
        }],
        summary: bookingPayload.booking.message || 'Booking meeting'
      };
    } else {
      // This is a legacy meeting webhook payload
      const meetingPayload = payload as WebhookPayload;

      // Validate required fields for meeting payload
      if (!meetingPayload.meeting_id || !meetingPayload.title ||
          !meetingPayload.start_time || !meetingPayload.end_time) {
        const response = NextResponse.json(
          { error: 'Missing required fields: meeting_id, title, start_time, end_time' },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }

      // Additional payload validation for meeting payload
      if (typeof meetingPayload.meeting_id !== 'string' || meetingPayload.meeting_id.length > 100) {
        const response = NextResponse.json(
          { error: 'Invalid meeting_id: must be a string with max 100 characters' },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }

      if (typeof meetingPayload.title !== 'string' || meetingPayload.title.length > 200) {
        const response = NextResponse.json(
          { error: 'Invalid title: must be a string with max 200 characters' },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }

      processedPayload = meetingPayload;
    }

    // Enhanced logging with the new webhook logger
    payloadLogId = await WebhookLogger.logIncomingPayload({
      webhookId: webhook.id,
      payload: payload as any,
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get('user-agent') || '',
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown',
      payloadType: isBookingPayload ? 'BOOKING' : 'MEETING',
      requestSize: JSON.stringify(payload).length
    });

    // Mark as processing
    await WebhookLogger.markAsProcessing(payloadLogId);

    // Create meeting report from processed payload
    const meetingReport = await prisma.meetingReport.create({
      data: {
        title: processedPayload.title,
        startTime: new Date(processedPayload.start_time),
        endTime: new Date(processedPayload.end_time),
        attendees: processedPayload.participants.map((p: any) => p.name),
        notes: processedPayload.summary || '',
        outcome: 'COMPLETED',
        customerName: processedPayload.participants[0]?.name || 'Unknown',
        customerEmail: processedPayload.participants[0]?.email || '',
        hostId: isBookingPayload ? (payload as BookingWebhookPayload).booking.host_user_id : processedPayload.meeting_id,
        isAssigned: false,
        userId: webhook.createdBy || 'system'
      }
    });

    // Send notifications to all active outgoing endpoints
    const deliveryPromises = webhook.outgoingEndpoints.map(async (endpoint) => {
      try {
        // Process template if available
        let processedMessage = null;
        if (endpoint.messageTemplate?.template) {
          const templateProcessor = new TemplateProcessor();

          if (isBookingPayload) {
            // Create booking context for template processing
            const bookingContext = templateProcessor.createBookingContext(payload);
            processedMessage = templateProcessor.processTemplate(endpoint.messageTemplate.template, bookingContext);
          } else {
            // Create meeting context for template processing
            const meetingContext = {
              ...processedPayload,
              timestamp: new Date().toISOString()
            };
            processedMessage = templateProcessor.processTemplate(endpoint.messageTemplate.template, meetingContext);
          }
        }

        // For Slack endpoints, use the enhanced Slack notification function
        if (endpoint.name.toLowerCase().includes('slack')) {
          if (isBookingPayload) {
            // Use booking-specific notification with processed template
            await sendBookingSlackNotification(payload as BookingWebhookPayload, processedMessage);
          } else {
            // Use legacy meeting notification
            await sendSlackNotification({
              title: processedPayload.title,
              startTime: processedPayload.start_time,
              endTime: processedPayload.end_time,
              participants: processedPayload.participants,
              summary: processedPayload.summary,
              meetingId: processedPayload.meeting_id
            });
          }
        }

        // Log successful delivery
        await prisma.deliveryLog.create({
          data: {
            endpointId: endpoint.id,
            payloadLogId: payloadLogId,
            status: 'SUCCESS',
            deliveredAt: new Date(),
            response: 'Notification sent successfully'
          }
        });

        return { success: true, endpointId: endpoint.id };
      } catch (error) {
        console.error(`Failed to deliver to endpoint ${endpoint.id}:`, error);
        
        // Log failed delivery
        await prisma.deliveryLog.create({
          data: {
            endpointId: endpoint.id,
            payloadLogId: payloadLogId,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });

        return { success: false, endpointId: endpoint.id, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const deliveryResults = await Promise.all(deliveryPromises);
    const successCount = deliveryResults.filter(r => r.success).length;
    const failureCount = deliveryResults.filter(r => !r.success).length;

    // Mark payload as processed successfully
    await WebhookLogger.markAsProcessed(payloadLogId, 200);

    const response = NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        webhookId: webhook.id,
        payloadLogId: payloadLogId,
        meetingReportId: meetingReport.id,
        deliveryResults: {
          total: deliveryResults.length,
          successful: successCount,
          failed: failureCount,
          details: deliveryResults
        }
      }
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Try to mark payload as failed if we have a payloadLogId
    try {
      if (typeof payloadLogId !== 'undefined') {
        await WebhookLogger.markAsFailed(
          payloadLogId,
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    } catch (logError) {
      console.error('Failed to log error status:', logError);
    }

    const response = NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );

    return addSecurityHeaders(response);
  }
}

// Handle GET requests for webhook verification
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  
  // Find webhook by URL token
  const webhook = await prisma.incomingWebhook.findFirst({
    where: {
      url: `/webhook/${token}`,
      status: 'ACTIVE'
    }
  });

  if (!webhook) {
    const response = NextResponse.json(
      { error: 'Webhook not found or inactive' },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    webhookId: webhook.id,
    webhookName: webhook.name
  });

  return addSecurityHeaders(response);
}
