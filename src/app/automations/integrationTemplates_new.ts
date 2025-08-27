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
  MdBusinessCenter,
  MdExtension,
  MdAutoAwesome
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
    color: 'bg-green-500',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'Shopify',
      event: 'order_created',
      description: 'When a new order is placed on your Shopify store'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Receive new order webhook from Shopify',
        variables: ['order_number', 'customer_name', 'total_amount']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send order confirmation message to customer',
        template: 'Hi {{customer_name}}! 🛒 Your order {{order_number}} for ${{total_amount}} has been confirmed. We\'ll send you updates as we process it. Thank you for shopping with us!'
      }
    ],
    benefits: [
      'Instant order confirmations',
      'Improved customer experience',
      'Reduced customer inquiries',
      'Automated order notifications'
    ]
  },

  {
    id: 'woocommerce-abandoned-cart',
    name: 'WooCommerce Cart Recovery',
    description: 'Recover abandoned carts with WhatsApp reminders',
    category: 'e-commerce',
    integration: 'woocommerce',
    icon: 'MdShoppingCart',
    color: 'bg-purple-500',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'WooCommerce',
      event: 'cart_abandoned',
      description: 'When a customer abandons their cart'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Detect abandoned cart event',
        variables: ['customer_name', 'cart_value', 'product_names']
      },
      {
        step: 2,
        action: 'wait',
        description: 'Wait 30 minutes before sending reminder'
      },
      {
        step: 3,
        action: 'send_message',
        description: 'Send cart recovery message',
        template: 'Hi {{customer_name}}! 🛍️ You left {{product_names}} in your cart worth ${{cart_value}}. Complete your purchase now and get FREE shipping! [Complete Order]'
      }
    ],
    benefits: [
      'Recover lost sales',
      'Increase conversion rates',
      'Personalized reminders',
      'Boost revenue automatically'
    ]
  },

  {
    id: 'magento-order-shipped',
    name: 'Magento Shipping Updates',
    description: 'Notify customers when orders are shipped',
    category: 'e-commerce',
    integration: 'magento',
    icon: 'MdNotifications',
    color: 'bg-orange-500',
    trigger: {
      type: 'webhook',
      platform: 'Magento',
      event: 'order_shipped',
      description: 'When an order is shipped'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Receive shipping notification',
        variables: ['order_number', 'tracking_number', 'estimated_delivery']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send shipping notification',
        template: 'Great news! 📦 Your order {{order_number}} has been shipped. Track it here: {{tracking_number}}. Expected delivery: {{estimated_delivery}}'
      }
    ],
    benefits: [
      'Real-time shipping updates',
      'Reduce delivery inquiries',
      'Improve customer satisfaction',
      'Professional communication'
    ]
  },

  {
    id: 'bigcommerce-new-customer',
    name: 'BigCommerce Welcome Series',
    description: 'Welcome new customers with personalized messages',
    category: 'e-commerce',
    integration: 'bigcommerce',
    icon: 'MdPersonAdd',
    color: 'bg-blue-600',
    trigger: {
      type: 'webhook',
      platform: 'BigCommerce',
      event: 'customer_created',
      description: 'When a new customer registers'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New customer registration detected',
        variables: ['customer_name', 'email', 'store_name']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send welcome message',
        template: 'Welcome to {{store_name}}, {{customer_name}}! 🎉 Thanks for joining us. Get 10% off your first order with code WELCOME10. Happy shopping!'
      }
    ],
    benefits: [
      'Engage new customers immediately',
      'Increase first purchase rate',
      'Build brand loyalty',
      'Automated onboarding'
    ]
  },

  // CRM Integrations
  {
    id: 'hubspot-new-lead',
    name: 'HubSpot Lead Notifications',
    description: 'Get instant alerts for new leads in HubSpot',
    category: 'crm',
    integration: 'hubspot',
    icon: 'MdAccountBox',
    color: 'bg-orange-600',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'HubSpot',
      event: 'contact_created',
      description: 'When a new contact/lead is created'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New lead detected in HubSpot',
        variables: ['lead_name', 'company', 'lead_score', 'source']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert sales team about new lead',
        template: '🔥 NEW LEAD ALERT!\nName: {{lead_name}}\nCompany: {{company}}\nScore: {{lead_score}}\nSource: {{source}}\n\nTime to follow up!'
      }
    ],
    benefits: [
      'Instant lead notifications',
      'Faster response times',
      'Never miss opportunities',
      'Team coordination'
    ]
  },

  {
    id: 'salesforce-deal-won',
    name: 'Salesforce Deal Celebrations',
    description: 'Celebrate when deals are won in Salesforce',
    category: 'crm',
    integration: 'salesforce',
    icon: 'MdBusinessCenter',
    color: 'bg-blue-500',
    trigger: {
      type: 'webhook',
      platform: 'Salesforce',
      event: 'opportunity_won',
      description: 'When an opportunity is marked as won'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Deal won notification from Salesforce',
        variables: ['deal_name', 'amount', 'sales_rep', 'account_name']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Celebrate the win with team',
        template: '🎉 DEAL WON! 🎉\n{{sales_rep}} just closed {{deal_name}} with {{account_name}} for ${{amount}}! Congratulations team! 🚀'
      }
    ],
    benefits: [
      'Team motivation',
      'Celebrate wins together',
      'Track success metrics',
      'Boost morale'
    ]
  },

  {
    id: 'pipedrive-deal-updated',
    name: 'Pipedrive Deal Updates',
    description: 'Track deal stage changes in Pipedrive',
    category: 'crm',
    integration: 'pipedrive',
    icon: 'MdTrendingUp',
    color: 'bg-green-600',
    trigger: {
      type: 'webhook',
      platform: 'Pipedrive',
      event: 'deal_updated',
      description: 'When a deal stage is updated'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Deal stage change detected',
        variables: ['deal_title', 'stage', 'value', 'person_name']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Update team on deal progress',
        template: '📈 Deal Update: "{{deal_title}}" with {{person_name}} moved to {{stage}}. Value: ${{value}}'
      }
    ],
    benefits: [
      'Real-time deal tracking',
      'Team visibility',
      'Pipeline monitoring',
      'Progress notifications'
    ]
  },

  // Productivity Integrations
  {
    id: 'zapier-workflow-trigger',
    name: 'Zapier Multi-App Automation',
    description: 'Trigger actions across multiple apps via Zapier',
    category: 'productivity',
    integration: 'zapier',
    icon: 'MdExtension',
    color: 'bg-orange-500',
    trigger: {
      type: 'webhook',
      platform: 'Zapier',
      event: 'zap_triggered',
      description: 'When a Zapier automation is triggered'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Zapier webhook received',
        variables: ['zap_name', 'trigger_app', 'action_data']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send automation notification',
        template: '⚡ Zapier Automation Triggered!\nZap: {{zap_name}}\nTriggered by: {{trigger_app}}\nData: {{action_data}}'
      }
    ],
    benefits: [
      'Connect 5000+ apps',
      'Complex automation workflows',
      'Multi-platform integration',
      'Powerful automation'
    ]
  },

  {
    id: 'slack-channel-message',
    name: 'Slack Team Notifications',
    description: 'Forward important Slack messages to WhatsApp',
    category: 'productivity',
    integration: 'slack',
    icon: 'MdChat',
    color: 'bg-purple-500',
    trigger: {
      type: 'webhook',
      platform: 'Slack',
      event: 'message_posted',
      description: 'When a message is posted in specific channel'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Important Slack message detected',
        variables: ['channel_name', 'user_name', 'message_text']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Forward to WhatsApp',
        template: '💬 Slack Alert from #{{channel_name}}\n{{user_name}}: {{message_text}}'
      }
    ],
    benefits: [
      'Never miss important messages',
      'Mobile notifications',
      'Cross-platform communication',
      'Team coordination'
    ]
  },

  // Finance Integrations
  {
    id: 'stripe-payment-received',
    name: 'Stripe Payment Notifications',
    description: 'Get instant alerts for successful payments',
    category: 'finance',
    integration: 'stripe',
    icon: 'MdPayment',
    color: 'bg-purple-600',
    popular: true,
    trigger: {
      type: 'webhook',
      platform: 'Stripe',
      event: 'payment_intent.succeeded',
      description: 'When a payment is successfully processed'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Payment confirmation from Stripe',
        variables: ['amount', 'currency', 'customer_email', 'payment_method']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send payment confirmation',
        template: '💳 Payment Received!\nAmount: {{amount}} {{currency}}\nCustomer: {{customer_email}}\nMethod: {{payment_method}}\n\nThank you for your payment!'
      }
    ],
    benefits: [
      'Instant payment confirmations',
      'Real-time revenue tracking',
      'Customer payment receipts',
      'Automated accounting'
    ]
  },

  {
    id: 'razorpay-subscription-payment',
    name: 'Razorpay Subscription Updates',
    description: 'Track subscription payments and renewals',
    category: 'finance',
    integration: 'razorpay',
    icon: 'MdAttachMoney',
    color: 'bg-blue-700',
    trigger: {
      type: 'webhook',
      platform: 'Razorpay',
      event: 'subscription.charged',
      description: 'When a subscription payment is processed'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Subscription payment processed',
        variables: ['customer_name', 'plan_name', 'amount', 'next_billing']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send subscription confirmation',
        template: '✅ Subscription Renewed!\nHi {{customer_name}}, your {{plan_name}} subscription has been renewed for ₹{{amount}}. Next billing: {{next_billing}}'
      }
    ],
    benefits: [
      'Subscription management',
      'Customer retention',
      'Payment tracking',
      'Automated renewals'
    ]
  },

  // Support Integrations
  {
    id: 'zendesk-ticket-created',
    name: 'Zendesk Ticket Alerts',
    description: 'Get notified when new support tickets are created',
    category: 'support',
    integration: 'zendesk',
    icon: 'MdSupport',
    color: 'bg-green-700',
    trigger: {
      type: 'webhook',
      platform: 'Zendesk',
      event: 'ticket_created',
      description: 'When a new support ticket is created'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New support ticket detected',
        variables: ['ticket_id', 'customer_name', 'subject', 'priority']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert support team',
        template: '🎫 NEW TICKET #{{ticket_id}}\nCustomer: {{customer_name}}\nSubject: {{subject}}\nPriority: {{priority}}\n\nPlease respond promptly!'
      }
    ],
    benefits: [
      'Faster response times',
      'Team coordination',
      'Priority management',
      'Customer satisfaction'
    ]
  },

  // Marketing Integrations
  {
    id: 'mailchimp-campaign-sent',
    name: 'Mailchimp Campaign Notifications',
    description: 'Track email campaign performance',
    category: 'marketing',
    integration: 'mailchimp',
    icon: 'MdCampaign',
    color: 'bg-yellow-600',
    trigger: {
      type: 'webhook',
      platform: 'Mailchimp',
      event: 'campaign_sent',
      description: 'When an email campaign is sent'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Email campaign sent notification',
        variables: ['campaign_title', 'recipients', 'send_time']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify marketing team',
        template: '📧 Campaign Sent!\n"{{campaign_title}}" sent to {{recipients}} subscribers at {{send_time}}. Monitor performance in Mailchimp dashboard.'
      }
    ],
    benefits: [
      'Campaign tracking',
      'Performance monitoring',
      'Team notifications',
      'Marketing automation'
    ]
  },

  // Analytics Integrations
  {
    id: 'analytics-conversion',
    name: 'Google Analytics Conversion Tracking',
    description: 'Send WhatsApp notification when conversion goal is achieved',
    category: 'analytics',
    integration: 'analytics',
    icon: 'MdTrendingUp',
    color: 'bg-yellow-500',
    trigger: {
      type: 'webhook',
      platform: 'Google Analytics',
      event: 'conversion_achieved',
      description: 'When a conversion goal is completed'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Conversion goal achieved notification',
        variables: ['goal_name', 'conversion_value', 'user_id', 'page_url']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify about conversion',
        template: '🎯 Conversion Alert!\nGoal: {{goal_name}}\nValue: ${{conversion_value}}\nUser: {{user_id}}\nPage: {{page_url}}'
      }
    ],
    benefits: [
      'Real-time conversion tracking',
      'Goal monitoring',
      'Performance insights',
      'Revenue optimization'
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
