// Integration-based automation templates
import { 
  MdShoppingCart,
  MdAccountBox,
  MdCampaign,
  MdEmail,
  MdPayment,
  MdSupport,
  MdNotifications,
  MdAttachMoney,
  MdInventory,
  MdPersonAdd,
  MdTrendingUp,
  MdBugReport,
  MdChat,
  MdEvent,
  MdBusinessCenter
} from "react-icons/md";

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  integration: string;
  icon: string;
  color: string;
  popular?: boolean;
  trigger: {
    type: string;
    platform: string;
    event: string;
    description: string;
  };
  workflow: {
    step: number;
    action: string;
    description: string;
    template?: string;
    variables?: string[];
  }[];
  benefits: string[];
}

export const integrationTemplates: IntegrationTemplate[] = [
  // E-commerce Integrations
  {
    id: 'shopify-new-order',
    name: 'Shopify Order Confirmation',
    description: 'Send WhatsApp confirmation when new Shopify order is received',
    category: 'e-commerce',
    integration: 'shopify',
    icon: 'MdShoppingCart',
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'Shopify',
      event: 'order_created',
      description: 'Triggers when a new order is placed on your Shopify store'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive order details from Shopify',
        variables: ['order_number', 'customer_name', 'total_amount', 'items']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send order confirmation message to customer',
        template: 'Hi {{customer_name}}! Your order #{{order_number}} for ${{total_amount}} has been confirmed. We\'ll notify you when it ships. 📦'
      },
      {
        step: 3,
        action: 'notify_admin',
        description: 'Send internal notification to admin',
        template: '🛒 New order received: #{{order_number}} - ${{total_amount}} from {{customer_name}}'
      }
    ],
    benefits: [
      'Instant customer confirmation',
      'Reduce support inquiries',
      'Improve customer satisfaction',
      'Real-time order tracking'
    ]
  },
  {
    id: 'woocommerce-abandoned-cart',
    name: 'WooCommerce Cart Recovery',
    description: 'Recover abandoned carts with automated WhatsApp reminders',
    category: 'e-commerce',
    integration: 'woocommerce',
    icon: 'MdShoppingCart',
    color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'WooCommerce',
      event: 'cart_abandoned',
      description: 'Triggers when a cart is abandoned for 30 minutes'
    },
    workflow: [
      {
        step: 1,
        action: 'wait',
        description: 'Wait 30 minutes after cart abandonment'
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send cart recovery message',
        template: 'Hi {{customer_name}}! You left {{item_count}} items in your cart worth ${{cart_total}}. Complete your purchase now and get 10% off! 🛒'
      },
      {
        step: 3,
        action: 'wait',
        description: 'Wait 24 hours if no response'
      },
      {
        step: 4,
        action: 'send_message',
        description: 'Send final reminder with urgency',
        template: '⏰ Last chance! Your cart expires in 2 hours. Don\'t miss out on ${{cart_total}} worth of items!'
      }
    ],
    benefits: [
      'Recover lost sales',
      'Increase conversion rates',
      'Personalized reminders',
      'Automated follow-ups'
    ]
  },

  // CRM Integrations
  {
    id: 'hubspot-new-lead',
    name: 'HubSpot Lead Notification',
    description: 'Instant WhatsApp alerts for new leads from HubSpot',
    category: 'crm',
    integration: 'hubspot',
    icon: 'MdPersonAdd',
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'HubSpot',
      event: 'contact_created',
      description: 'Triggers when a new lead is added to HubSpot'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive lead information from HubSpot',
        variables: ['lead_name', 'email', 'phone', 'company', 'source']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send welcome message to lead',
        template: 'Hi {{lead_name}}! Thanks for your interest in our services. A team member will contact you within 24 hours. 🤝'
      },
      {
        step: 3,
        action: 'notify_team',
        description: 'Alert sales team about new lead',
        template: '🎯 New lead: {{lead_name}} from {{company}}. Source: {{source}}. Contact: {{phone}}'
      }
    ],
    benefits: [
      'Instant lead engagement',
      'Faster response times',
      'Better lead nurturing',
      'Improved conversion rates'
    ]
  },
  {
    id: 'salesforce-deal-update',
    name: 'Salesforce Deal Updates',
    description: 'Get notified when deals progress in Salesforce',
    category: 'crm',
    integration: 'salesforce',
    icon: 'MdTrendingUp',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    trigger: {
      type: 'webhook',
      platform: 'Salesforce',
      event: 'opportunity_updated',
      description: 'Triggers when deal stage changes in Salesforce'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive deal update from Salesforce',
        variables: ['deal_name', 'amount', 'stage', 'owner', 'close_date']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify deal owner',
        template: '📈 Deal Update: {{deal_name}} moved to {{stage}}. Amount: ${{amount}}. Close date: {{close_date}}'
      },
      {
        step: 3,
        action: 'conditional_action',
        description: 'If deal is won, send celebration message',
        template: '🎉 Congratulations! Deal {{deal_name}} worth ${{amount}} has been WON!'
      }
    ],
    benefits: [
      'Real-time deal tracking',
      'Team celebration moments',
      'Pipeline visibility',
      'Faster deal closure'
    ]
  },

  // Productivity Integrations
  {
    id: 'zapier-workflow-trigger',
    name: 'Zapier Multi-App Automation',
    description: 'Connect 5000+ apps through Zapier webhooks',
    category: 'productivity',
    integration: 'zapier',
    icon: 'MdAutoAwesome',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'Zapier',
      event: 'zap_triggered',
      description: 'Triggers when any connected Zapier automation runs'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive data from Zapier webhook',
        variables: ['app_name', 'action', 'data', 'user']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send notification about automation',
        template: '⚡ {{app_name}} automation completed: {{action}}. Details: {{data}}'
      }
    ],
    benefits: [
      'Connect any app',
      'Unlimited possibilities',
      'No-code integration',
      'Centralized notifications'
    ]
  },
  {
    id: 'slack-mention-alert',
    name: 'Slack Mention Alerts',
    description: 'Get WhatsApp alerts for important Slack mentions',
    category: 'productivity',
    integration: 'slack',
    icon: 'MdChat',
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    trigger: {
      type: 'webhook',
      platform: 'Slack',
      event: 'mention_received',
      description: 'Triggers when you\'re mentioned in important Slack channels'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive mention details from Slack',
        variables: ['channel', 'user', 'message', 'urgency']
      },
      {
        step: 2,
        action: 'conditional_action',
        description: 'Only send if urgent or from specific channels',
      },
      {
        step: 3,
        action: 'send_message',
        description: 'Send mention alert',
        template: '💬 Slack mention in #{{channel}} from {{user}}: {{message}}'
      }
    ],
    benefits: [
      'Never miss important mentions',
      'Stay connected remotely',
      'Priority filtering',
      'Quick response capability'
    ]
  },

  // Payment Integrations
  {
    id: 'stripe-payment-received',
    name: 'Stripe Payment Notifications',
    description: 'Instant alerts for successful Stripe payments',
    category: 'finance',
    integration: 'stripe',
    icon: 'MdPayment',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'Stripe',
      event: 'payment_succeeded',
      description: 'Triggers when a payment is successfully processed'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive payment details from Stripe',
        variables: ['amount', 'currency', 'customer_email', 'invoice_id']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send payment confirmation to customer',
        template: '✅ Payment received! ${{amount}} {{currency}} has been processed. Invoice: {{invoice_id}}. Thank you!'
      },
      {
        step: 3,
        action: 'notify_admin',
        description: 'Alert admin about new payment',
        template: '💰 New payment: ${{amount}} {{currency}} from {{customer_email}}'
      }
    ],
    benefits: [
      'Instant payment confirmation',
      'Reduce payment disputes',
      'Improve customer trust',
      'Real-time revenue tracking'
    ]
  },
  {
    id: 'razorpay-subscription-alert',
    name: 'Razorpay Subscription Updates',
    description: 'Monitor subscription renewals and failures',
    category: 'finance',
    integration: 'razorpay',
    icon: 'MdEvent',
    color: 'bg-gradient-to-br from-blue-600 to-indigo-600',
    trigger: {
      type: 'webhook',
      platform: 'Razorpay',
      event: 'subscription_charged',
      description: 'Triggers on subscription events (renewal, failure, etc.)'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive subscription details from Razorpay',
        variables: ['subscription_id', 'status', 'amount', 'customer', 'next_billing']
      },
      {
        step: 2,
        action: 'conditional_action',
        description: 'Different actions based on subscription status',
      },
      {
        step: 3,
        action: 'send_message',
        description: 'Send appropriate message to customer',
        template: '🔄 Subscription update: Your {{subscription_id}} has been {{status}}. Next billing: {{next_billing}}'
      }
    ],
    benefits: [
      'Reduce churn',
      'Proactive customer service',
      'Payment failure recovery',
      'Subscription management'
    ]
  },

  // Support Integrations
  {
    id: 'zendesk-ticket-created',
    name: 'Zendesk Ticket Alerts',
    description: 'Instant notifications for new support tickets',
    category: 'support',
    integration: 'zendesk',
    icon: 'MdSupport',
    color: 'bg-gradient-to-br from-green-600 to-teal-600',
    trigger: {
      type: 'webhook',
      platform: 'Zendesk',
      event: 'ticket_created',
      description: 'Triggers when a new support ticket is created'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive ticket details from Zendesk',
        variables: ['ticket_id', 'customer_name', 'priority', 'subject', 'assignee']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Acknowledge ticket to customer',
        template: 'Hi {{customer_name}}! We received your support request #{{ticket_id}}. Our team will respond within 24 hours. 🎧'
      },
      {
        step: 3,
        action: 'notify_agent',
        description: 'Alert assigned agent',
        template: '🎫 New {{priority}} priority ticket #{{ticket_id}}: {{subject}}. Assigned to: {{assignee}}'
      }
    ],
    benefits: [
      'Faster response times',
      'Better customer satisfaction',
      'Team coordination',
      'SLA compliance'
    ]
  },

  // Marketing Integrations
  {
    id: 'mailchimp-campaign-sent',
    name: 'Mailchimp Campaign Alerts',
    description: 'Track email campaign performance with WhatsApp updates',
    category: 'marketing',
    integration: 'mailchimp',
    icon: 'MdEmail',
    color: 'bg-gradient-to-br from-yellow-600 to-orange-600',
    trigger: {
      type: 'webhook',
      platform: 'Mailchimp',
      event: 'campaign_sent',
      description: 'Triggers when an email campaign is sent'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive campaign metrics from Mailchimp',
        variables: ['campaign_name', 'sent_count', 'open_rate', 'click_rate']
      },
      {
        step: 2,
        action: 'wait',
        description: 'Wait 4 hours for initial metrics'
      },
      {
        step: 3,
        action: 'send_message',
        description: 'Send campaign performance summary',
        template: '📧 Campaign "{{campaign_name}}" sent to {{sent_count}} subscribers. Open rate: {{open_rate}}%, Click rate: {{click_rate}}%'
      }
    ],
    benefits: [
      'Real-time campaign tracking',
      'Performance insights',
      'Quick optimization',
      'Team alignment'
    ]
  },

  // Analytics Integration
  {
    id: 'google-analytics-goal',
    name: 'Google Analytics Goal Alerts',
    description: 'Get notified when important website goals are achieved',
    category: 'analytics',
    integration: 'google-analytics',
    icon: 'MdTrendingUp',
    color: 'bg-gradient-to-br from-red-500 to-orange-500',
    trigger: {
      type: 'webhook',
      platform: 'Google Analytics',
      event: 'goal_completed',
      description: 'Triggers when a conversion goal is reached'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_data',
        description: 'Receive goal completion data',
        variables: ['goal_name', 'value', 'user_location', 'source']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Celebrate goal achievement',
        template: '🎯 Goal achieved! {{goal_name}} worth ${{value}} from {{user_location}}. Source: {{source}}'
      }
    ],
    benefits: [
      'Real-time conversion tracking',
      'Celebrate wins instantly',
      'Source attribution',
      'Team motivation'
    ]
  }
];

export const getTemplatesByIntegration = (integrationId: string): IntegrationTemplate[] => {
  return integrationTemplates.filter(template => template.integration === integrationId);
};

export const getTemplatesByCategory = (category: string): IntegrationTemplate[] => {
  if (category === 'all') return integrationTemplates;
  return integrationTemplates.filter(template => template.category === category);
};

export const getPopularTemplates = (): IntegrationTemplate[] => {
  return integrationTemplates.filter(template => template.popular);
};
