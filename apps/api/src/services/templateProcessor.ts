import { logger } from '../utils/logger';

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
      logger.error('Template processing failed', {
        template: template.substring(0, 200),
        error: error.message,
      });
      throw new Error(`Template processing failed: ${error.message}`);
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
        logger.warn('Failed to evaluate template expression', {
          expression,
          error: error.message,
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

    // Handle conditional expressions (e.g., "user.name || 'Anonymous'")
    if (expression.includes('||')) {
      const parts = expression.split('||').map(part => part.trim());
      for (const part of parts) {
        const value = this.evaluateExpression(part, context);
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
      }
      return '';
    }

    // Handle string literals
    if ((expression.startsWith('"') && expression.endsWith('"')) ||
        (expression.startsWith("'") && expression.endsWith("'"))) {
      return expression.slice(1, -1);
    }

    // Handle number literals
    if (/^\d+(\.\d+)?$/.test(expression)) {
      return parseFloat(expression);
    }

    // Handle boolean literals
    if (expression === 'true') return true;
    if (expression === 'false') return false;
    if (expression === 'null') return null;

    // If nothing matches, try to get as property
    return this.getNestedProperty(context, expression);
  }

  /**
   * Get nested property from context (e.g., "user.profile.name")
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * Call a safe function with arguments
   */
  private callFunction(functionName: string, argsStr: string, context: TemplateContext): any {
    const func = TemplateProcessor.SAFE_FUNCTIONS[functionName];
    if (!func) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    // Parse arguments
    const args: any[] = [];
    if (argsStr.trim()) {
      // Simple argument parsing (supports strings, numbers, and property references)
      const argParts = this.parseArguments(argsStr);
      for (const arg of argParts) {
        args.push(this.evaluateExpression(arg, context));
      }
    }

    return func(...args);
  }

  /**
   * Parse function arguments (simple implementation)
   */
  private parseArguments(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let depth = 0;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
      } else if (!inQuotes && char === '(') {
        depth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        depth--;
        current += char;
      } else if (!inQuotes && char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
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
          errors.push(`Invalid expression '${placeholder}': ${error.message}`);
        }
      }

    } catch (error) {
      errors.push(`Template validation failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract all placeholders from a template
   */
  private extractPlaceholders(template: string): string[] {
    const placeholders: string[] = [];
    let match;

    while ((match = TemplateProcessor.PLACEHOLDER_REGEX.exec(template)) !== null) {
      placeholders.push(match[1].trim());
    }

    // Reset regex state
    TemplateProcessor.PLACEHOLDER_REGEX.lastIndex = 0;

    return placeholders;
  }

  /**
   * Get available variables from a context object
   */
  getAvailableVariables(context: TemplateContext, prefix: string = ''): string[] {
    const variables: string[] = [];

    for (const [key, value] of Object.entries(context)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      variables.push(fullKey);

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        variables.push(...this.getAvailableVariables(value, fullKey));
      }
    }

    return variables;
  }

  /**
   * Create a Slack-specific template
   */
  createSlackTemplate(options: {
    title: string;
    message: string;
    color?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
    actions?: Array<{ text: string; url: string }>;
  }): string {
    const template = {
      text: options.title,
      attachments: [
        {
          color: options.color || 'good',
          text: options.message,
          fields: options.fields || [],
          actions: options.actions || [],
          footer: 'DailySync',
          ts: '{{date("timestamp")}}',
        },
      ],
    };

    return JSON.stringify(template, null, 2);
  }
}

// Export singleton instance
export const templateProcessor = new TemplateProcessor();
