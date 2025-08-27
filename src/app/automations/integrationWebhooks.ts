// Integration webhook configurations for automation builder
export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  event_type: string;
  sample_payload: any;
  trigger_description: string;
  variables: {
    name: string;
    description: string;
    type: string;
    example: string;
  }[];
}

export interface IntegrationWebhooks {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  webhook_url_pattern: string;
  auth_required: boolean;
  webhooks: WebhookEvent[];
}

export const integrationWebhooks: IntegrationWebhooks[] = [
  // Shopify Integration
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce store automation',
    category: 'e-commerce',
    icon: 'MdStore',
    color: 'bg-green-500',
    webhook_url_pattern: 'https://your-domain.com/webhooks/shopify/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'order_created',
        name: 'New Order',
        description: 'Triggered when a new order is placed',
        event_type: 'orders/create',
        trigger_description: 'When a customer places a new order on your Shopify store',
        sample_payload: {
          id: 12345,
          order_number: "#1001",
          total_price: "29.99",
          currency: "USD",
          customer: {
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            phone: "+1234567890"
          },
          line_items: [
            {
              title: "Product Name",
              quantity: 1,
              price: "29.99"
            }
          ],
          shipping_address: {
            address1: "123 Main St",
            city: "New York",
            country: "United States"
          }
        },
        variables: [
          { name: 'order_number', description: 'Order number', type: 'string', example: '#1001' },
          { name: 'customer_name', description: 'Customer full name', type: 'string', example: 'John Doe' },
          { name: 'customer_phone', description: 'Customer phone number', type: 'string', example: '+1234567890' },
          { name: 'total_amount', description: 'Order total amount', type: 'number', example: '29.99' },
          { name: 'currency', description: 'Order currency', type: 'string', example: 'USD' },
          { name: 'item_count', description: 'Number of items', type: 'number', example: '3' }
        ]
      },
      {
        id: 'order_shipped',
        name: 'Order Shipped',
        description: 'Triggered when an order is shipped',
        event_type: 'orders/fulfilled',
        trigger_description: 'When an order is marked as shipped/fulfilled',
        sample_payload: {
          id: 12345,
          order_number: "#1001",
          tracking_number: "1Z999AA1234567890",
          tracking_url: "https://tracking.example.com/1Z999AA1234567890",
          shipping_method: "Standard Shipping"
        },
        variables: [
          { name: 'order_number', description: 'Order number', type: 'string', example: '#1001' },
          { name: 'tracking_number', description: 'Tracking number', type: 'string', example: '1Z999AA1234567890' },
          { name: 'tracking_url', description: 'Tracking URL', type: 'string', example: 'https://tracking.example.com' },
          { name: 'shipping_method', description: 'Shipping method', type: 'string', example: 'Standard Shipping' }
        ]
      },
      {
        id: 'cart_abandoned',
        name: 'Cart Abandoned',
        description: 'Triggered when a cart is abandoned for 30+ minutes',
        event_type: 'checkouts/create',
        trigger_description: 'When a customer adds items to cart but doesn\'t complete purchase',
        sample_payload: {
          id: 67890,
          cart_token: "abc123",
          total_price: "49.99",
          line_items: [
            {
              title: "Product Name",
              quantity: 2,
              price: "24.99"
            }
          ],
          customer: {
            email: "john@example.com",
            phone: "+1234567890"
          }
        },
        variables: [
          { name: 'cart_total', description: 'Cart total amount', type: 'number', example: '49.99' },
          { name: 'customer_email', description: 'Customer email', type: 'string', example: 'john@example.com' },
          { name: 'customer_phone', description: 'Customer phone', type: 'string', example: '+1234567890' },
          { name: 'item_count', description: 'Number of items in cart', type: 'number', example: '2' }
        ]
      },
      {
        id: 'product_low_stock',
        name: 'Low Stock Alert',
        description: 'Triggered when product inventory is low',
        event_type: 'products/update',
        trigger_description: 'When a product\'s inventory falls below threshold',
        sample_payload: {
          id: 123,
          title: "Product Name",
          variant_id: 456,
          inventory_quantity: 2,
          inventory_policy: "deny"
        },
        variables: [
          { name: 'product_name', description: 'Product name', type: 'string', example: 'Amazing Product' },
          { name: 'stock_quantity', description: 'Current stock quantity', type: 'number', example: '2' },
          { name: 'product_id', description: 'Product ID', type: 'string', example: '123' }
        ]
      }
    ]
  },

  // WooCommerce Integration
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce automation',
    category: 'e-commerce',
    icon: 'MdShoppingCart',
    color: 'bg-purple-500',
    webhook_url_pattern: 'https://your-domain.com/webhooks/woocommerce/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'order_created',
        name: 'New Order',
        description: 'Triggered when a new order is placed',
        event_type: 'order.created',
        trigger_description: 'When a customer places a new order on your WooCommerce store',
        sample_payload: {
          id: 123,
          order_key: "wc_order_abc123",
          total: "35.00",
          status: "processing",
          billing: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            phone: "+1234567890"
          },
          line_items: [
            {
              name: "Product Name",
              quantity: 1,
              total: "35.00"
            }
          ]
        },
        variables: [
          { name: 'order_id', description: 'Order ID', type: 'string', example: '123' },
          { name: 'customer_name', description: 'Customer full name', type: 'string', example: 'Jane Smith' },
          { name: 'customer_phone', description: 'Customer phone number', type: 'string', example: '+1234567890' },
          { name: 'order_total', description: 'Order total amount', type: 'number', example: '35.00' },
          { name: 'order_status', description: 'Order status', type: 'string', example: 'processing' }
        ]
      },
      {
        id: 'payment_complete',
        name: 'Payment Complete',
        description: 'Triggered when payment is completed',
        event_type: 'order.payment_complete',
        trigger_description: 'When payment for an order is successfully processed',
        sample_payload: {
          id: 123,
          payment_method: "stripe",
          transaction_id: "txn_abc123",
          total: "35.00"
        },
        variables: [
          { name: 'order_id', description: 'Order ID', type: 'string', example: '123' },
          { name: 'payment_method', description: 'Payment method used', type: 'string', example: 'stripe' },
          { name: 'transaction_id', description: 'Transaction ID', type: 'string', example: 'txn_abc123' },
          { name: 'amount', description: 'Payment amount', type: 'number', example: '35.00' }
        ]
      }
    ]
  },

  // HubSpot Integration
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    category: 'crm',
    icon: 'MdPerson',
    color: 'bg-orange-500',
    webhook_url_pattern: 'https://your-domain.com/webhooks/hubspot/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'contact_created',
        name: 'New Contact',
        description: 'Triggered when a new contact is created',
        event_type: 'contact.creation',
        trigger_description: 'When a new lead or contact is added to HubSpot',
        sample_payload: {
          objectId: 123,
          properties: {
            firstname: "John",
            lastname: "Doe",
            email: "john@example.com",
            phone: "+1234567890",
            company: "Acme Corp",
            website: "https://acme.com",
            lifecyclestage: "lead"
          }
        },
        variables: [
          { name: 'contact_name', description: 'Contact full name', type: 'string', example: 'John Doe' },
          { name: 'contact_email', description: 'Contact email', type: 'string', example: 'john@example.com' },
          { name: 'contact_phone', description: 'Contact phone', type: 'string', example: '+1234567890' },
          { name: 'company_name', description: 'Company name', type: 'string', example: 'Acme Corp' },
          { name: 'lifecycle_stage', description: 'Contact lifecycle stage', type: 'string', example: 'lead' }
        ]
      },
      {
        id: 'deal_created',
        name: 'New Deal',
        description: 'Triggered when a new deal is created',
        event_type: 'deal.creation',
        trigger_description: 'When a new deal is added to HubSpot pipeline',
        sample_payload: {
          objectId: 456,
          properties: {
            dealname: "Big Deal",
            amount: "5000",
            dealstage: "appointmentscheduled",
            pipeline: "default",
            closedate: "2024-12-31"
          }
        },
        variables: [
          { name: 'deal_name', description: 'Deal name', type: 'string', example: 'Big Deal' },
          { name: 'deal_amount', description: 'Deal amount', type: 'number', example: '5000' },
          { name: 'deal_stage', description: 'Deal stage', type: 'string', example: 'appointmentscheduled' },
          { name: 'close_date', description: 'Expected close date', type: 'string', example: '2024-12-31' }
        ]
      },
      {
        id: 'deal_stage_change',
        name: 'Deal Stage Change',
        description: 'Triggered when a deal moves between stages',
        event_type: 'deal.propertyChange',
        trigger_description: 'When a deal is moved to a different stage in the pipeline',
        sample_payload: {
          objectId: 456,
          propertyName: "dealstage",
          propertyValue: "closedwon",
          previousValue: "negotiation"
        },
        variables: [
          { name: 'deal_id', description: 'Deal ID', type: 'string', example: '456' },
          { name: 'new_stage', description: 'New deal stage', type: 'string', example: 'closedwon' },
          { name: 'previous_stage', description: 'Previous deal stage', type: 'string', example: 'negotiation' }
        ]
      }
    ]
  },

  // Stripe Integration
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing automation',
    category: 'finance',
    icon: 'MdPayment',
    color: 'bg-indigo-500',
    webhook_url_pattern: 'https://your-domain.com/webhooks/stripe/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'payment_succeeded',
        name: 'Payment Successful',
        description: 'Triggered when a payment is successful',
        event_type: 'payment_intent.succeeded',
        trigger_description: 'When a customer\'s payment is successfully processed',
        sample_payload: {
          id: "pi_1234567890",
          amount: 2999,
          currency: "usd",
          status: "succeeded",
          customer: "cus_1234567890",
          metadata: {
            order_id: "order_123"
          }
        },
        variables: [
          { name: 'payment_id', description: 'Payment ID', type: 'string', example: 'pi_1234567890' },
          { name: 'amount', description: 'Payment amount (in cents)', type: 'number', example: '2999' },
          { name: 'currency', description: 'Payment currency', type: 'string', example: 'usd' },
          { name: 'customer_id', description: 'Stripe customer ID', type: 'string', example: 'cus_1234567890' }
        ]
      },
      {
        id: 'payment_failed',
        name: 'Payment Failed',
        description: 'Triggered when a payment fails',
        event_type: 'payment_intent.payment_failed',
        trigger_description: 'When a customer\'s payment attempt fails',
        sample_payload: {
          id: "pi_1234567890",
          amount: 2999,
          currency: "usd",
          status: "payment_failed",
          last_payment_error: {
            message: "Your card was declined."
          }
        },
        variables: [
          { name: 'payment_id', description: 'Payment ID', type: 'string', example: 'pi_1234567890' },
          { name: 'amount', description: 'Payment amount (in cents)', type: 'number', example: '2999' },
          { name: 'error_message', description: 'Payment failure reason', type: 'string', example: 'Your card was declined.' }
        ]
      },
      {
        id: 'subscription_created',
        name: 'Subscription Created',
        description: 'Triggered when a new subscription is created',
        event_type: 'customer.subscription.created',
        trigger_description: 'When a customer starts a new subscription',
        sample_payload: {
          id: "sub_1234567890",
          customer: "cus_1234567890",
          status: "active",
          current_period_start: 1640995200,
          current_period_end: 1643673600,
          plan: {
            id: "plan_monthly",
            amount: 999,
            currency: "usd",
            interval: "month"
          }
        },
        variables: [
          { name: 'subscription_id', description: 'Subscription ID', type: 'string', example: 'sub_1234567890' },
          { name: 'customer_id', description: 'Customer ID', type: 'string', example: 'cus_1234567890' },
          { name: 'plan_amount', description: 'Plan amount (in cents)', type: 'number', example: '999' },
          { name: 'plan_interval', description: 'Plan interval', type: 'string', example: 'month' }
        ]
      }
    ]
  },

  // Zendesk Integration
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support automation',
    category: 'support',
    icon: 'MdSupport',
    color: 'bg-green-600',
    webhook_url_pattern: 'https://your-domain.com/webhooks/zendesk/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'ticket_created',
        name: 'New Ticket',
        description: 'Triggered when a new support ticket is created',
        event_type: 'ticket.created',
        trigger_description: 'When a customer creates a new support ticket',
        sample_payload: {
          ticket: {
            id: 123,
            subject: "Need help with order",
            priority: "normal",
            status: "open",
            requester_id: 456,
            assignee_id: 789,
            description: "I need help with my recent order..."
          }
        },
        variables: [
          { name: 'ticket_id', description: 'Ticket ID', type: 'string', example: '123' },
          { name: 'ticket_subject', description: 'Ticket subject', type: 'string', example: 'Need help with order' },
          { name: 'ticket_priority', description: 'Ticket priority', type: 'string', example: 'normal' },
          { name: 'requester_id', description: 'Customer ID who created ticket', type: 'string', example: '456' }
        ]
      },
      {
        id: 'ticket_solved',
        name: 'Ticket Solved',
        description: 'Triggered when a ticket is marked as solved',
        event_type: 'ticket.solved',
        trigger_description: 'When a support ticket is resolved and marked as solved',
        sample_payload: {
          ticket: {
            id: 123,
            subject: "Need help with order",
            status: "solved",
            assignee_id: 789,
            solved_at: "2024-01-15T10:30:00Z"
          }
        },
        variables: [
          { name: 'ticket_id', description: 'Ticket ID', type: 'string', example: '123' },
          { name: 'ticket_subject', description: 'Ticket subject', type: 'string', example: 'Need help with order' },
          { name: 'assignee_id', description: 'Agent who solved the ticket', type: 'string', example: '789' },
          { name: 'solved_at', description: 'When ticket was solved', type: 'string', example: '2024-01-15T10:30:00Z' }
        ]
      }
    ]
  },

  // Mailchimp Integration
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    category: 'marketing',
    icon: 'MdEmail',
    color: 'bg-yellow-600',
    webhook_url_pattern: 'https://your-domain.com/webhooks/mailchimp/{event}',
    auth_required: true,
    webhooks: [
      {
        id: 'campaign_sent',
        name: 'Campaign Sent',
        description: 'Triggered when an email campaign is sent',
        event_type: 'campaign.sent',
        trigger_description: 'When an email campaign has been sent to subscribers',
        sample_payload: {
          campaign_id: "abc123",
          list_id: "def456",
          subject_line: "Monthly Newsletter",
          emails_sent: 1500,
          send_time: "2024-01-15T09:00:00Z"
        },
        variables: [
          { name: 'campaign_id', description: 'Campaign ID', type: 'string', example: 'abc123' },
          { name: 'subject_line', description: 'Email subject line', type: 'string', example: 'Monthly Newsletter' },
          { name: 'emails_sent', description: 'Number of emails sent', type: 'number', example: '1500' },
          { name: 'send_time', description: 'When campaign was sent', type: 'string', example: '2024-01-15T09:00:00Z' }
        ]
      },
      {
        id: 'subscriber_added',
        name: 'New Subscriber',
        description: 'Triggered when someone subscribes to your list',
        event_type: 'list.subscribe',
        trigger_description: 'When someone subscribes to your email list',
        sample_payload: {
          list_id: "def456",
          email: "subscriber@example.com",
          merge_fields: {
            FNAME: "John",
            LNAME: "Doe"
          },
          timestamp: "2024-01-15T10:30:00Z"
        },
        variables: [
          { name: 'subscriber_email', description: 'Subscriber email', type: 'string', example: 'subscriber@example.com' },
          { name: 'first_name', description: 'Subscriber first name', type: 'string', example: 'John' },
          { name: 'last_name', description: 'Subscriber last name', type: 'string', example: 'Doe' },
          { name: 'list_id', description: 'Mailing list ID', type: 'string', example: 'def456' }
        ]
      }
    ]
  }
];

export const getIntegrationByAccount = (integrationId: string): IntegrationWebhooks | undefined => {
  return integrationWebhooks.find(integration => integration.id === integrationId);
};

export const getWebhooksByIntegration = (integrationId: string): WebhookEvent[] => {
  const integration = getIntegrationByAccount(integrationId);
  return integration ? integration.webhooks : [];
};

export const getAllIntegrationCategories = (): string[] => {
  return [...new Set(integrationWebhooks.map(integration => integration.category))];
};
