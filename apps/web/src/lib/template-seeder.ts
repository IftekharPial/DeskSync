/**
 * Service to seed default templates into the database
 */

import { prisma } from '@dailysync/database';
import { DEFAULT_TEMPLATES, DefaultTemplate } from './default-templates';

export interface TemplateSeederOptions {
  webhookId: string;
  overwriteExisting?: boolean;
  templateTypes?: string[];
}

/**
 * Seed default templates for a specific webhook
 */
export async function seedDefaultTemplatesForWebhook(options: TemplateSeederOptions): Promise<void> {
  const { webhookId, overwriteExisting = false, templateTypes } = options;

  // Verify webhook exists
  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id: webhookId }
  });

  if (!webhook) {
    throw new Error(`Webhook with ID ${webhookId} not found`);
  }

  // Filter templates based on webhook type and optional template types filter
  let templatesToSeed = DEFAULT_TEMPLATES.filter(template => {
    // Match webhook type (BOOKING templates for any webhook, MEETING for meeting webhooks)
    const webhookTypeMatch = template.webhookType === 'BOOKING' || 
                            (template.webhookType === 'MEETING' && webhook.type === 'MEETING') ||
                            template.webhookType === 'GENERIC';
    
    // Optional filter by template types
    const typeMatch = !templateTypes || templateTypes.includes(template.type);
    
    return webhookTypeMatch && typeMatch;
  });

  for (const template of templatesToSeed) {
    await seedTemplate(webhookId, template, overwriteExisting);
  }
}

/**
 * Seed a single template for a webhook
 */
async function seedTemplate(webhookId: string, template: DefaultTemplate, overwriteExisting: boolean): Promise<void> {
  try {
    // Check if template already exists
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        incomingWebhookId: webhookId,
        name: template.name
      }
    });

    if (existingTemplate && !overwriteExisting) {
      console.log(`Template "${template.name}" already exists for webhook ${webhookId}, skipping`);
      return;
    }

    if (existingTemplate && overwriteExisting) {
      // Update existing template
      await prisma.messageTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          template: template.template,
          variables: template.variables
        }
      });
      console.log(`Updated template "${template.name}" for webhook ${webhookId}`);
    } else {
      // Create new template
      await prisma.messageTemplate.create({
        data: {
          name: template.name,
          template: template.template,
          variables: template.variables,
          incomingWebhookId: webhookId
        }
      });
      console.log(`Created template "${template.name}" for webhook ${webhookId}`);
    }
  } catch (error) {
    console.error(`Failed to seed template "${template.name}" for webhook ${webhookId}:`, error);
    throw error;
  }
}

/**
 * Seed default templates for all webhooks
 */
export async function seedDefaultTemplatesForAllWebhooks(overwriteExisting: boolean = false): Promise<void> {
  const webhooks = await prisma.incomingWebhook.findMany({
    select: { id: true, type: true, name: true }
  });

  for (const webhook of webhooks) {
    try {
      await seedDefaultTemplatesForWebhook({
        webhookId: webhook.id,
        overwriteExisting
      });
      console.log(`Seeded templates for webhook "${webhook.name}" (${webhook.id})`);
    } catch (error) {
      console.error(`Failed to seed templates for webhook "${webhook.name}" (${webhook.id}):`, error);
    }
  }
}

/**
 * Create a default booking template for a webhook if it doesn't exist
 */
export async function ensureDefaultBookingTemplate(webhookId: string): Promise<string> {
  // Check if a booking template already exists
  const existingTemplate = await prisma.messageTemplate.findFirst({
    where: {
      incomingWebhookId: webhookId,
      name: { contains: 'Booking' }
    }
  });

  if (existingTemplate) {
    return existingTemplate.id;
  }

  // Create default booking template
  const defaultBookingTemplate = DEFAULT_TEMPLATES.find(t => 
    t.webhookType === 'BOOKING' && t.type === 'SLACK'
  );

  if (!defaultBookingTemplate) {
    throw new Error('Default booking template not found');
  }

  const newTemplate = await prisma.messageTemplate.create({
    data: {
      name: defaultBookingTemplate.name,
      template: defaultBookingTemplate.template,
      variables: defaultBookingTemplate.variables,
      incomingWebhookId: webhookId
    }
  });

  return newTemplate.id;
}

/**
 * Get or create a default template for a specific webhook and type
 */
export async function getOrCreateDefaultTemplate(
  webhookId: string, 
  type: 'SLACK' | 'TEAMS' | 'API' | 'GOOGLE_SHEETS',
  webhookType: 'GENERIC' | 'MEETING' | 'BOOKING'
): Promise<string> {
  // First try to find existing template
  const existingTemplate = await prisma.messageTemplate.findFirst({
    where: {
      incomingWebhookId: webhookId,
      name: { contains: webhookType === 'BOOKING' ? 'Booking' : 'Meeting' }
    }
  });

  if (existingTemplate) {
    return existingTemplate.id;
  }

  // Find the appropriate default template
  const defaultTemplate = DEFAULT_TEMPLATES.find(t => 
    t.type === type && t.webhookType === webhookType
  );

  if (!defaultTemplate) {
    throw new Error(`No default template found for type ${type} and webhook type ${webhookType}`);
  }

  // Create the template
  const newTemplate = await prisma.messageTemplate.create({
    data: {
      name: defaultTemplate.name,
      template: defaultTemplate.template,
      variables: defaultTemplate.variables,
      incomingWebhookId: webhookId
    }
  });

  return newTemplate.id;
}

/**
 * Clean up orphaned templates (templates without associated webhooks)
 */
export async function cleanupOrphanedTemplates(): Promise<number> {
  const orphanedTemplates = await prisma.messageTemplate.findMany({
    where: {
      incomingWebhook: null
    }
  });

  if (orphanedTemplates.length > 0) {
    await prisma.messageTemplate.deleteMany({
      where: {
        id: { in: orphanedTemplates.map(t => t.id) }
      }
    });
  }

  return orphanedTemplates.length;
}
