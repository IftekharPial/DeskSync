/**
 * Default message templates for webhook notifications
 */

export interface DefaultTemplate {
  name: string;
  template: string;
  variables: string[];
  type: 'SLACK' | 'TEAMS' | 'API' | 'GOOGLE_SHEETS';
  webhookType: 'GENERIC' | 'MEETING' | 'BOOKING';
  description: string;
}

export const DEFAULT_BOOKING_SLACK_TEMPLATE: DefaultTemplate = {
  name: 'Default Booking Notification',
  template: `📅 *New Booking Received*

👤 *Customer:* {{first_name}} {{last_name}}
📧 *Email:* {{email}}
🕐 *Start Time:* {{start_time}}
🕑 *End Time:* {{end_time}}
🔗 *Meeting Link:* {{online_platform_link}}
👥 *Host ID:* {{host_user_id}}
👤 *Person ID:* {{person_user_id}}

💬 *Message:*
{{message}}

---
🤖 *Booking Details:*
• ID: {{booking_id}}
• Hash: {{booking_hash}}`,
  variables: [
    'first_name',
    'last_name', 
    'email',
    'message',
    'start_time',
    'end_time',
    'online_platform_link',
    'host_user_id',
    'person_user_id',
    'full_name',
    'booking_id',
    'booking_hash'
  ],
  type: 'SLACK',
  webhookType: 'BOOKING',
  description: 'Default template for booking notifications sent to Slack'
};

export const DEFAULT_BOOKING_TEAMS_TEMPLATE: DefaultTemplate = {
  name: 'Default Booking Teams Notification',
  template: `**📅 New Booking Received**

**👤 Customer:** {{first_name}} {{last_name}}  
**📧 Email:** {{email}}  
**🕐 Start Time:** {{start_time}}  
**🕑 End Time:** {{end_time}}  
**🔗 Meeting Link:** {{online_platform_link}}  
**👥 Host ID:** {{host_user_id}}  
**👤 Person ID:** {{person_user_id}}  

**💬 Message:**  
{{message}}

---
**🤖 Booking Details:**  
• ID: {{booking_id}}  
• Hash: {{booking_hash}}`,
  variables: [
    'first_name',
    'last_name', 
    'email',
    'message',
    'start_time',
    'end_time',
    'online_platform_link',
    'host_user_id',
    'person_user_id',
    'full_name',
    'booking_id',
    'booking_hash'
  ],
  type: 'TEAMS',
  webhookType: 'BOOKING',
  description: 'Default template for booking notifications sent to Microsoft Teams'
};

export const DEFAULT_BOOKING_API_TEMPLATE: DefaultTemplate = {
  name: 'Default Booking API Template',
  template: `{
  "type": "booking_notification",
  "customer": {
    "first_name": "{{first_name}}",
    "last_name": "{{last_name}}",
    "full_name": "{{full_name}}",
    "email": "{{email}}"
  },
  "booking": {
    "id": "{{booking_id}}",
    "hash": "{{booking_hash}}",
    "message": "{{message}}",
    "start_time": "{{start_time}}",
    "end_time": "{{end_time}}",
    "online_platform_link": "{{online_platform_link}}",
    "host_user_id": "{{host_user_id}}",
    "person_user_id": "{{person_user_id}}"
  },
  "timestamp": "{{date('iso')}}",
  "source": "desksync_webhook"
}`,
  variables: [
    'first_name',
    'last_name', 
    'email',
    'message',
    'start_time',
    'end_time',
    'online_platform_link',
    'host_user_id',
    'person_user_id',
    'full_name',
    'booking_id',
    'booking_hash'
  ],
  type: 'API',
  webhookType: 'BOOKING',
  description: 'Default JSON template for booking notifications sent to API endpoints'
};

export const DEFAULT_MEETING_SLACK_TEMPLATE: DefaultTemplate = {
  name: 'Default Meeting Notification',
  template: `📅 *New Meeting Created*

📋 *Title:* {{title}}
🕐 *Start:* {{start_time}}
🕑 *End:* {{end_time}}
👥 *Participants:* {{participants}}
📝 *Summary:* {{summary}}
🆔 *Meeting ID:* {{meeting_id}}`,
  variables: [
    'title',
    'start_time',
    'end_time',
    'participants',
    'summary',
    'meeting_id'
  ],
  type: 'SLACK',
  webhookType: 'MEETING',
  description: 'Default template for meeting notifications sent to Slack'
};

// Collection of all default templates
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  DEFAULT_BOOKING_SLACK_TEMPLATE,
  DEFAULT_BOOKING_TEAMS_TEMPLATE,
  DEFAULT_BOOKING_API_TEMPLATE,
  DEFAULT_MEETING_SLACK_TEMPLATE
];

/**
 * Get default template by type and webhook type
 */
export function getDefaultTemplate(type: string, webhookType: string): DefaultTemplate | undefined {
  return DEFAULT_TEMPLATES.find(template => 
    template.type === type && template.webhookType === webhookType
  );
}

/**
 * Get all default templates for a specific webhook type
 */
export function getDefaultTemplatesForWebhookType(webhookType: string): DefaultTemplate[] {
  return DEFAULT_TEMPLATES.filter(template => template.webhookType === webhookType);
}

/**
 * Get all available template variables for a webhook type
 */
export function getTemplateVariables(webhookType: string): string[] {
  const templates = getDefaultTemplatesForWebhookType(webhookType);
  const allVariables = new Set<string>();
  
  templates.forEach(template => {
    template.variables.forEach(variable => allVariables.add(variable));
  });
  
  return Array.from(allVariables).sort();
}

/**
 * Validate template variables against available variables for webhook type
 */
export function validateTemplateVariables(template: string, webhookType: string): {
  isValid: boolean;
  invalidVariables: string[];
  availableVariables: string[];
} {
  const availableVariables = getTemplateVariables(webhookType);
  const templateVariables = extractTemplateVariables(template);
  const invalidVariables = templateVariables.filter(variable => 
    !availableVariables.includes(variable)
  );
  
  return {
    isValid: invalidVariables.length === 0,
    invalidVariables,
    availableVariables
  };
}

/**
 * Extract template variables from a template string
 */
function extractTemplateVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    // Handle function calls like date('iso') - extract just the function name
    const variable = match[1].trim();
    if (variable.includes('(')) {
      const functionName = variable.split('(')[0];
      variables.add(functionName);
    } else {
      variables.add(variable);
    }
  }
  
  return Array.from(variables);
}
