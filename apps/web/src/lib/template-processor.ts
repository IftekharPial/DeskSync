/**
 * Template processor for webhook message templates
 */

export interface TemplateContext {
  [key: string]: any;
}

export class TemplateProcessor {
  private static readonly PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;
  private static readonly SAFE_FUNCTIONS = {
    date: (format?: string) => {
      const now = new Date();
      if (format === 'iso') return now.toISOString();
      if (format === 'timestamp') return now.getTime().toString();
      return now.toLocaleString();
    },
    uppercase: (str: string) => String(str).toUpperCase(),
    lowercase: (str: string) => String(str).toLowerCase(),
    truncate: (str: string, length: number = 100) => {
      const text = String(str);
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    default: (value: any, defaultValue: any) => value ?? defaultValue,
  };

  /**
   * Process a template string with the given context
   */
  processTemplate(template: string, context: TemplateContext): any {
    try {
      // If template is a JSON string, parse it first
      let templateObj: any;
      try {
        templateObj = JSON.parse(template);
      } catch {
        // If not valid JSON, treat as plain string
        templateObj = template;
      }

      // Process the template recursively
      const processed = this.processValue(templateObj, context);

      return processed;
    } catch (error) {
      console.error('Template processing failed', {
        template: template.substring(0, 200),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process any value (string, object, array) recursively
   */
  private processValue(value: any, context: TemplateContext): any {
    if (typeof value === 'string') {
      return this.processString(value, context);
    } else if (Array.isArray(value)) {
      return value.map(item => this.processValue(item, context));
    } else if (value && typeof value === 'object') {
      const processed: any = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = this.processValue(val, context);
      }
      return processed;
    }
    return value;
  }

  /**
   * Process a string template with placeholders
   */
  private processString(template: string, context: TemplateContext): string {
    return template.replace(TemplateProcessor.PLACEHOLDER_REGEX, (match, expression) => {
      try {
        const result = this.evaluateExpression(expression.trim(), context);
        return String(result ?? '');
      } catch (error) {
        console.warn('Failed to evaluate template expression', {
          expression,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return match; // Return original placeholder if evaluation fails
      }
    });
  }

  /**
   * Safely evaluate a template expression
   */
  private evaluateExpression(expression: string, context: TemplateContext): any {
    // Handle simple property access (e.g., "user.name", "payload.data")
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expression)) {
      return this.getNestedProperty(context, expression);
    }

    // Handle function calls (e.g., "date('iso')", "uppercase(user.name)")
    const functionMatch = expression.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\((.*)\)$/);
    if (functionMatch) {
      const [, functionName, argsStr] = functionMatch;
      return this.callFunction(functionName, argsStr, context);
    }

    // If no pattern matches, try to get as property
    return this.getNestedProperty(context, expression);
  }

  /**
   * Get nested property from context (e.g., "user.profile.name")
   */
  private getNestedProperty(context: TemplateContext, path: string): any {
    return path.split('.').reduce((obj, key) => {
      return obj && typeof obj === 'object' ? obj[key] : undefined;
    }, context);
  }

  /**
   * Call a safe function with arguments
   */
  private callFunction(functionName: string, argsStr: string, context: TemplateContext): any {
    const func = TemplateProcessor.SAFE_FUNCTIONS[functionName as keyof typeof TemplateProcessor.SAFE_FUNCTIONS];
    if (!func) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    // Parse arguments (simple implementation for common cases)
    const args: any[] = [];
    if (argsStr.trim()) {
      // Handle string literals and property references
      const argParts = argsStr.split(',').map(arg => arg.trim());
      for (const arg of argParts) {
        if (arg.startsWith('"') && arg.endsWith('"')) {
          // String literal
          args.push(arg.slice(1, -1));
        } else if (arg.startsWith("'") && arg.endsWith("'")) {
          // String literal
          args.push(arg.slice(1, -1));
        } else if (!isNaN(Number(arg))) {
          // Number
          args.push(Number(arg));
        } else {
          // Property reference
          args.push(this.getNestedProperty(context, arg));
        }
      }
    }

    return func(...args);
  }

  /**
   * Extract template variables from a template string
   */
  extractPlaceholders(template: string): string[] {
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

  /**
   * Validate a template for syntax errors
   */
  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check if it's valid JSON
      let templateObj: any;
      try {
        templateObj = JSON.parse(template);
      } catch {
        // Not JSON, treat as string
        templateObj = template;
      }

      // Find all placeholders and validate them
      const placeholders = this.extractPlaceholders(template);
      for (const placeholder of placeholders) {
        try {
          // Try to parse the expression
          this.evaluateExpression(placeholder, {});
        } catch (error) {
          errors.push(`Invalid expression '${placeholder}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create template context from booking payload
   */
  createBookingContext(payload: any): TemplateContext {
    if (!payload.booking) {
      return payload; // Return as-is if not a booking payload
    }

    const { booking } = payload;
    
    // Format times
    const startTime = new Date(booking.start_time).toLocaleString();
    const endTime = new Date(booking.end_time).toLocaleString();
    
    // Create flattened context for template processing
    return {
      // Original booking data
      ...booking,
      
      // Formatted data
      start_time: startTime,
      end_time: endTime,
      full_name: `${booking.first_name} ${booking.last_name}`.trim(),
      online_platform_link: booking.location_details?.online_platform_link || 'Not provided',
      booking_id: booking.id?.toString() || '',
      booking_hash: booking.hash || '',
      
      // Additional context
      calendar_event: payload.calendar_event,
      timestamp: new Date().toISOString(),
      
      // Utility functions available in templates
      date: TemplateProcessor.SAFE_FUNCTIONS.date,
      uppercase: TemplateProcessor.SAFE_FUNCTIONS.uppercase,
      lowercase: TemplateProcessor.SAFE_FUNCTIONS.lowercase,
      truncate: TemplateProcessor.SAFE_FUNCTIONS.truncate,
      default: TemplateProcessor.SAFE_FUNCTIONS.default,
    };
  }
}

// Export singleton instance
export const templateProcessor = new TemplateProcessor();
