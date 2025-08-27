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

  {
    id: 'prestashop-inventory-low',
    name: 'PrestaShop Low Stock Alerts',
    description: 'Get notified when inventory runs low',
    category: 'e-commerce',
    integration: 'prestashop',
    icon: 'MdInventory',
    color: 'bg-pink-500',
    trigger: {
      type: 'webhook',
      platform: 'PrestaShop',
      event: 'stock_low',
      description: 'When product stock falls below threshold'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Low stock alert from PrestaShop',
        variables: ['product_name', 'current_stock', 'threshold']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert inventory team',
        template: '⚠️ LOW STOCK ALERT!\nProduct: {{product_name}}\nCurrent: {{current_stock}} units\nThreshold: {{threshold}}\n\nReorder immediately!'
      }
    ],
    benefits: [
      'Prevent stockouts',
      'Automated inventory management',
      'Improve availability',
      'Reduce lost sales'
    ]
  },

  {
    id: 'opencart-new-review',
    name: 'OpenCart Review Notifications',
    description: 'Get alerted when customers leave reviews',
    category: 'e-commerce',
    integration: 'opencart',
    icon: 'MdTrendingUp',
    color: 'bg-cyan-500',
    trigger: {
      type: 'webhook',
      platform: 'OpenCart',
      event: 'review_posted',
      description: 'When a customer posts a product review'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New review notification',
        variables: ['customer_name', 'product_name', 'rating', 'review_text']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify team about new review',
        template: '⭐ New Review!\nCustomer: {{customer_name}}\nProduct: {{product_name}}\nRating: {{rating}}/5\nReview: {{review_text}}'
      }
    ],
    benefits: [
      'Monitor customer feedback',
      'Respond quickly to reviews',
      'Improve products based on feedback',
      'Build customer relationships'
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

  {
    id: 'zoho-contact-updated',
    name: 'Zoho CRM Contact Updates',
    description: 'Track important contact changes in Zoho CRM',
    category: 'crm',
    integration: 'zoho',
    icon: 'MdPersonAdd',
    color: 'bg-red-500',
    trigger: {
      type: 'webhook',
      platform: 'Zoho CRM',
      event: 'contact_updated',
      description: 'When contact information is updated'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Contact update detected',
        variables: ['contact_name', 'field_changed', 'old_value', 'new_value']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify relevant team members',
        template: '👤 Contact Update\n{{contact_name}}\n{{field_changed}}: {{old_value}} → {{new_value}}'
      }
    ],
    benefits: [
      'Track contact changes',
      'Team synchronization',
      'Data integrity monitoring',
      'Relationship management'
    ]
  },

  {
    id: 'freshsales-lead-score',
    name: 'Freshsales Lead Scoring',
    description: 'Get alerts when lead scores change significantly',
    category: 'crm',
    integration: 'freshsales',
    icon: 'MdTrendingUp',
    color: 'bg-green-500',
    trigger: {
      type: 'webhook',
      platform: 'Freshsales',
      event: 'lead_score_changed',
      description: 'When lead score increases or decreases significantly'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Lead score change detected',
        variables: ['lead_name', 'old_score', 'new_score', 'change_reason']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert sales team',
        template: '📊 Lead Score Alert!\n{{lead_name}}\nScore: {{old_score}} → {{new_score}}\nReason: {{change_reason}}'
      }
    ],
    benefits: [
      'Prioritize hot leads',
      'Focus sales efforts',
      'Track engagement quality',
      'Improve conversion rates'
    ]
  },

  {
    id: 'airtable-record-created',
    name: 'Airtable New Record Alerts',
    description: 'Get notified when new records are added to Airtable',
    category: 'crm',
    integration: 'airtable',
    icon: 'MdNotifications',
    color: 'bg-yellow-500',
    trigger: {
      type: 'webhook',
      platform: 'Airtable',
      event: 'record_created',
      description: 'When a new record is added to specified table'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New record notification',
        variables: ['table_name', 'record_id', 'record_data']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify team about new record',
        template: '📝 New {{table_name}} Record\nID: {{record_id}}\nData: {{record_data}}'
      }
    ],
    benefits: [
      'Real-time data updates',
      'Team collaboration',
      'Process automation',
      'Data tracking'
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
    id: 'paypal-payment-received',
    name: 'PayPal Payment Notifications',
    description: 'Track PayPal transactions and payments',
    category: 'finance',
    integration: 'paypal',
    icon: 'MdPayment',
    color: 'bg-blue-600',
    trigger: {
      type: 'webhook',
      platform: 'PayPal',
      event: 'payment_completed',
      description: 'When a PayPal payment is completed'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'PayPal payment notification',
        variables: ['amount', 'currency', 'payer_email', 'transaction_id']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Send payment confirmation',
        template: '💰 PayPal Payment Received!\nAmount: {{amount}} {{currency}}\nFrom: {{payer_email}}\nTransaction: {{transaction_id}}'
      }
    ],
    benefits: [
      'Payment tracking',
      'Transaction monitoring',
      'Customer confirmations',
      'Revenue visibility'
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

  {
    id: 'quickbooks-invoice-paid',
    name: 'QuickBooks Invoice Payments',
    description: 'Get notified when invoices are paid',
    category: 'finance',
    integration: 'quickbooks',
    icon: 'MdPayment',
    color: 'bg-green-600',
    trigger: {
      type: 'webhook',
      platform: 'QuickBooks',
      event: 'invoice_paid',
      description: 'When an invoice is marked as paid'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Invoice payment notification',
        variables: ['invoice_number', 'customer_name', 'amount', 'payment_date']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Notify accounting team',
        template: '✅ Invoice Paid!\nInvoice: {{invoice_number}}\nCustomer: {{customer_name}}\nAmount: ${{amount}}\nDate: {{payment_date}}'
      }
    ],
    benefits: [
      'Cash flow tracking',
      'Accounts receivable management',
      'Payment confirmations',
      'Financial visibility'
    ]
  },

  {
    id: 'xero-expense-submitted',
    name: 'Xero Expense Approvals',
    description: 'Get notified when expenses need approval',
    category: 'finance',
    integration: 'xero',
    icon: 'MdAttachMoney',
    color: 'bg-blue-500',
    trigger: {
      type: 'webhook',
      platform: 'Xero',
      event: 'expense_submitted',
      description: 'When an expense is submitted for approval'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Expense approval request',
        variables: ['employee_name', 'amount', 'category', 'description']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert approvers',
        template: '💼 Expense Approval Needed\nEmployee: {{employee_name}}\nAmount: ${{amount}}\nCategory: {{category}}\nDescription: {{description}}'
      }
    ],
    benefits: [
      'Faster approvals',
      'Expense tracking',
      'Budget management',
      'Process automation'
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

  {
    id: 'freshdesk-ticket-escalated',
    name: 'Freshdesk Escalation Alerts',
    description: 'Get alerted when tickets are escalated',
    category: 'support',
    integration: 'freshdesk',
    icon: 'MdSupport',
    color: 'bg-green-600',
    trigger: {
      type: 'webhook',
      platform: 'Freshdesk',
      event: 'ticket_escalated',
      description: 'When a ticket is escalated to higher priority'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Ticket escalation detected',
        variables: ['ticket_id', 'customer_name', 'escalation_reason', 'assigned_agent']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert management team',
        template: '🚨 TICKET ESCALATED #{{ticket_id}}\nCustomer: {{customer_name}}\nReason: {{escalation_reason}}\nAssigned: {{assigned_agent}}'
      }
    ],
    benefits: [
      'Management visibility',
      'Issue escalation tracking',
      'Customer satisfaction focus',
      'Quality assurance'
    ]
  },

  {
    id: 'intercom-new-conversation',
    name: 'Intercom Conversation Alerts',
    description: 'Get notified about new customer conversations',
    category: 'support',
    integration: 'intercom',
    icon: 'MdChat',
    color: 'bg-blue-600',
    trigger: {
      type: 'webhook',
      platform: 'Intercom',
      event: 'conversation_started',
      description: 'When a customer starts a new conversation'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'New conversation detected',
        variables: ['customer_name', 'conversation_id', 'initial_message', 'customer_segment']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Alert support team',
        template: '💬 New Conversation\nCustomer: {{customer_name}}\nSegment: {{customer_segment}}\nMessage: {{initial_message}}'
      }
    ],
    benefits: [
      'Real-time customer engagement',
      'Personalized support',
      'Quick response times',
      'Customer satisfaction'
    ]
  },

  {
    id: 'crisp-chat-rating',
    name: 'Crisp Chat Ratings',
    description: 'Track customer satisfaction ratings',
    category: 'support',
    integration: 'crisp',
    icon: 'MdTrendingUp',
    color: 'bg-purple-600',
    trigger: {
      type: 'webhook',
      platform: 'Crisp',
      event: 'conversation_rated',
      description: 'When a customer rates a conversation'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Customer rating received',
        variables: ['customer_name', 'rating', 'feedback', 'agent_name']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Share feedback with team',
        template: '⭐ Customer Rating\nCustomer: {{customer_name}}\nRating: {{rating}}/5\nAgent: {{agent_name}}\nFeedback: {{feedback}}'
      }
    ],
    benefits: [
      'Customer satisfaction tracking',
      'Agent performance insights',
      'Service quality monitoring',
      'Continuous improvement'
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

  {
    id: 'klaviyo-flow-triggered',
    name: 'Klaviyo Flow Automation',
    description: 'Track automated email flow triggers',
    category: 'marketing',
    integration: 'klaviyo',
    icon: 'MdAutoAwesome',
    color: 'bg-purple-700',
    trigger: {
      type: 'webhook',
      platform: 'Klaviyo',
      event: 'flow_triggered',
      description: 'When an automated email flow is triggered'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'Flow trigger notification',
        variables: ['flow_name', 'customer_email', 'trigger_event', 'flow_step']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Track flow performance',
        template: '🔄 Flow Triggered: {{flow_name}}\nCustomer: {{customer_email}}\nTrigger: {{trigger_event}}\nStep: {{flow_step}}'
      }
    ],
    benefits: [
      'Automation monitoring',
      'Customer journey tracking',
      'Performance insights',
      'Personalization effectiveness'
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
  },

  {
    id: 'mixpanel-event-triggered',
    name: 'Mixpanel Event Tracking',
    description: 'Track important user events and behaviors',
    category: 'analytics',
    integration: 'mixpanel',
    icon: 'MdTrendingUp',
    color: 'bg-purple-600',
    trigger: {
      type: 'webhook',
      platform: 'Mixpanel',
      event: 'custom_event',
      description: 'When a specific user event is tracked'
    },
    workflow: [
      {
        step: 1,
        action: 'receive_webhook',
        description: 'User event detected',
        variables: ['event_name', 'user_id', 'event_properties', 'timestamp']
      },
      {
        step: 2,
        action: 'send_message',
        description: 'Share event insights',
        template: '📊 User Event: {{event_name}}\nUser: {{user_id}}\nProperties: {{event_properties}}\nTime: {{timestamp}}'
      }
    ],
    benefits: [
      'User behavior insights',
      'Real-time analytics',
      'Product usage tracking',
      'Data-driven decisions'
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
