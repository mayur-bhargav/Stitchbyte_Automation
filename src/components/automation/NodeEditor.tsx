/**
 * NodeEditor - Side panel for editing node properties
 * Dynamic editor that adapts to different node types
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';

interface NodeEditorProps {
  node: Node;
  onUpdate: (updatedNode: Node) => void;
  onClose: () => void;
}

// Integration event definitions
const getIntegrationEvents = (integrationId: string): { value: string; label: string }[] => {
  const eventMap: Record<string, { value: string; label: string }[]> = {
    // E-commerce platforms
    shopify: [
      { value: 'order_created', label: 'Order Created' },
      { value: 'order_updated', label: 'Order Updated' },
      { value: 'order_cancelled', label: 'Order Cancelled' },
      { value: 'order_fulfilled', label: 'Order Fulfilled' },
      { value: 'product_created', label: 'Product Created' },
      { value: 'product_updated', label: 'Product Updated' },
      { value: 'customer_created', label: 'Customer Created' },
      { value: 'cart_abandoned', label: 'Cart Abandoned' }
    ],
    woocommerce: [
      { value: 'order_completed', label: 'Order Completed' },
      { value: 'order_processing', label: 'Order Processing' },
      { value: 'order_failed', label: 'Order Failed' },
      { value: 'order_cancelled', label: 'Order Cancelled' },
      { value: 'product_purchased', label: 'Product Purchased' },
      { value: 'cart_abandoned', label: 'Cart Abandoned' },
      { value: 'payment_received', label: 'Payment Received' },
      { value: 'customer_registered', label: 'Customer Registered' }
    ],
    magento: [
      { value: 'order_placed', label: 'Order Placed' },
      { value: 'order_updated', label: 'Order Updated' },
      { value: 'shipment_created', label: 'Shipment Created' },
      { value: 'invoice_generated', label: 'Invoice Generated' },
      { value: 'customer_registered', label: 'Customer Registered' },
      { value: 'product_created', label: 'Product Created' }
    ],
    bigcommerce: [
      { value: 'order_created', label: 'Order Created' },
      { value: 'order_updated', label: 'Order Updated' },
      { value: 'order_shipped', label: 'Order Shipped' },
      { value: 'customer_created', label: 'Customer Created' },
      { value: 'product_updated', label: 'Product Updated' }
    ],
    
    // CRM platforms
    salesforce: [
      { value: 'lead_created', label: 'Lead Created' },
      { value: 'lead_updated', label: 'Lead Updated' },
      { value: 'opportunity_created', label: 'Opportunity Created' },
      { value: 'contact_created', label: 'Contact Created' },
      { value: 'deal_closed', label: 'Deal Closed' }
    ],
    hubspot: [
      { value: 'contact_created', label: 'Contact Created' },
      { value: 'deal_created', label: 'Deal Created' },
      { value: 'deal_won', label: 'Deal Won' },
      { value: 'contact_updated', label: 'Contact Updated' },
      { value: 'form_submitted', label: 'Form Submitted' }
    ],
    pipedrive: [
      { value: 'deal_created', label: 'Deal Created' },
      { value: 'deal_won', label: 'Deal Won' },
      { value: 'deal_lost', label: 'Deal Lost' },
      { value: 'person_created', label: 'Person Created' },
      { value: 'activity_scheduled', label: 'Activity Scheduled' }
    ],
    zoho: [
      { value: 'lead_created', label: 'Lead Created' },
      { value: 'contact_created', label: 'Contact Created' },
      { value: 'deal_created', label: 'Deal Created' },
      { value: 'deal_closed', label: 'Deal Closed' }
    ],
    
    // Productivity platforms
    notion: [
      { value: 'page_created', label: 'Page Created' },
      { value: 'page_updated', label: 'Page Updated' },
      { value: 'database_item_created', label: 'Database Item Created' },
      { value: 'database_item_updated', label: 'Database Item Updated' }
    ],
    sheets: [
      { value: 'row_added', label: 'Row Added' },
      { value: 'row_updated', label: 'Row Updated' },
      { value: 'row_deleted', label: 'Row Deleted' },
      { value: 'spreadsheet_modified', label: 'Spreadsheet Modified' }
    ],
    excel: [
      { value: 'file_modified', label: 'File Modified' },
      { value: 'row_inserted', label: 'Row Inserted' },
      { value: 'row_updated', label: 'Row Updated' },
      { value: 'worksheet_added', label: 'Worksheet Added' }
    ],
    airtable: [
      { value: 'record_created', label: 'Record Created' },
      { value: 'record_updated', label: 'Record Updated' },
      { value: 'record_deleted', label: 'Record Deleted' }
    ],
    
    // Payment platforms
    stripe: [
      { value: 'payment_received', label: 'Payment Received' },
      { value: 'payment_failed', label: 'Payment Failed' },
      { value: 'subscription_created', label: 'Subscription Created' },
      { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
      { value: 'invoice_paid', label: 'Invoice Paid' },
      { value: 'refund_processed', label: 'Refund Processed' }
    ],
    paypal: [
      { value: 'payment_completed', label: 'Payment Completed' },
      { value: 'payment_pending', label: 'Payment Pending' },
      { value: 'payment_refunded', label: 'Payment Refunded' },
      { value: 'subscription_created', label: 'Subscription Created' }
    ],
    razorpay: [
      { value: 'payment_captured', label: 'Payment Captured' },
      { value: 'payment_failed', label: 'Payment Failed' },
      { value: 'order_paid', label: 'Order Paid' },
      { value: 'refund_processed', label: 'Refund Processed' }
    ],
    
    // Marketing platforms
    mailchimp: [
      { value: 'subscriber_added', label: 'Subscriber Added' },
      { value: 'subscriber_updated', label: 'Subscriber Updated' },
      { value: 'campaign_sent', label: 'Campaign Sent' },
      { value: 'unsubscribed', label: 'Unsubscribed' }
    ],
    klaviyo: [
      { value: 'profile_created', label: 'Profile Created' },
      { value: 'email_opened', label: 'Email Opened' },
      { value: 'email_clicked', label: 'Email Clicked' },
      { value: 'subscribed', label: 'Subscribed' }
    ],
    'facebook-ads': [
      { value: 'lead_generated', label: 'Lead Generated' },
      { value: 'form_submitted', label: 'Form Submitted' },
      { value: 'ad_clicked', label: 'Ad Clicked' }
    ],
    'google-ads': [
      { value: 'conversion_tracked', label: 'Conversion Tracked' },
      { value: 'lead_generated', label: 'Lead Generated' },
      { value: 'form_submitted', label: 'Form Submitted' }
    ],
    
    // Support platforms
    zendesk: [
      { value: 'ticket_created', label: 'Ticket Created' },
      { value: 'ticket_updated', label: 'Ticket Updated' },
      { value: 'ticket_solved', label: 'Ticket Solved' },
      { value: 'ticket_closed', label: 'Ticket Closed' }
    ],
    freshdesk: [
      { value: 'ticket_created', label: 'Ticket Created' },
      { value: 'ticket_updated', label: 'Ticket Updated' },
      { value: 'ticket_resolved', label: 'Ticket Resolved' }
    ],
    intercom: [
      { value: 'conversation_started', label: 'Conversation Started' },
      { value: 'conversation_closed', label: 'Conversation Closed' },
      { value: 'user_created', label: 'User Created' },
      { value: 'user_tagged', label: 'User Tagged' }
    ]
  };

  return eventMap[integrationId] || [];
};

// Get event descriptions
const getEventDescription = (integrationId: string, eventValue: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    shopify: {
      order_created: 'Triggers when a new order is placed in your Shopify store',
      order_updated: 'Triggers when an existing order is modified',
      order_cancelled: 'Triggers when an order is cancelled',
      order_fulfilled: 'Triggers when an order is fulfilled and shipped',
      product_created: 'Triggers when a new product is added',
      product_updated: 'Triggers when product details are modified',
      customer_created: 'Triggers when a new customer account is created',
      cart_abandoned: 'Triggers when a customer abandons their shopping cart'
    },
    woocommerce: {
      order_completed: 'Triggers when an order is marked as completed',
      order_processing: 'Triggers when an order status changes to processing',
      order_failed: 'Triggers when an order payment fails',
      order_cancelled: 'Triggers when a customer or admin cancels an order',
      product_purchased: 'Triggers when a specific product is purchased',
      cart_abandoned: 'Triggers when cart is abandoned for specified time',
      payment_received: 'Triggers when payment is successfully processed',
      customer_registered: 'Triggers when a new customer registers'
    },
    notion: {
      page_created: 'Triggers when a new page is created in your workspace',
      page_updated: 'Triggers when an existing page is edited',
      database_item_created: 'Triggers when a new item is added to a database',
      database_item_updated: 'Triggers when a database item is modified'
    },
    sheets: {
      row_added: 'Triggers when a new row is added to the spreadsheet',
      row_updated: 'Triggers when an existing row is modified',
      row_deleted: 'Triggers when a row is deleted',
      spreadsheet_modified: 'Triggers on any change to the spreadsheet'
    },
    stripe: {
      payment_received: 'Triggers when a payment is successfully received',
      payment_failed: 'Triggers when a payment attempt fails',
      subscription_created: 'Triggers when a new subscription is created',
      subscription_cancelled: 'Triggers when a subscription is cancelled',
      invoice_paid: 'Triggers when an invoice is paid',
      refund_processed: 'Triggers when a refund is processed'
    }
  };

  return descriptions[integrationId]?.[eventValue] || 'Triggers when this event occurs in the integration';
};

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, onClose }) => {
  const [nodeData, setNodeData] = useState(node.data);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setNodeData(node.data);
    setErrors([]);
  }, [node]);

  const handleSave = () => {
    const validationErrors = validateNodeData();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedNode = {
      ...node,
      data: {
        ...nodeData,
        label: getNodeLabel(node.type!, nodeData)
      }
    };
    
    onUpdate(updatedNode);
  };

  const validateNodeData = (): string[] => {
    const errors: string[] = [];
    
    switch (node.type) {
      case 'sendMessage':
        if (!nodeData.messageText?.trim()) {
          errors.push('Message text is required');
        }
        break;
      case 'condition':
        if (!nodeData.conditionField?.trim()) {
          errors.push('Condition field is required');
        }
        if (!nodeData.conditionOperator) {
          errors.push('Condition operator is required');
        }
        break;
      case 'collectInput':
        if (!nodeData.variableName?.trim()) {
          errors.push('Variable name is required');
        }
        if (!nodeData.inputType) {
          errors.push('Input type is required');
        }
        break;
      case 'webhook':
        if (!nodeData.webhookUrl?.trim()) {
          errors.push('Webhook URL is required');
        }
        break;
      case 'trigger':
        if (nodeData.triggerType === 'keyword' && (!nodeData.keywords || nodeData.keywords.length === 0)) {
          errors.push('At least one keyword is required');
        }
        if (nodeData.triggerType === 'integration') {
          if (!nodeData.integrationId) {
            errors.push('Integration platform is required');
          }
          if (!nodeData.integrationEvent) {
            errors.push('Trigger event is required');
          }
        }
        break;
    }
    
    return errors;
  };

  const updateField = (field: string, value: any) => {
    setNodeData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const addKeyword = () => {
    const keywords = nodeData.keywords || [];
    keywords.push('');
    updateField('keywords', [...keywords]);
  };

  const updateKeyword = (index: number, value: string) => {
    const keywords = [...(nodeData.keywords || [])];
    keywords[index] = value;
    updateField('keywords', keywords);
  };

  const removeKeyword = (index: number) => {
    const keywords = [...(nodeData.keywords || [])];
    keywords.splice(index, 1);
    updateField('keywords', keywords);
  };

  const addQuickReply = () => {
    const quickReplies = nodeData.quickReplies || [];
    quickReplies.push('');
    updateField('quickReplies', [...quickReplies]);
  };

  const updateQuickReply = (index: number, value: string) => {
    const quickReplies = [...(nodeData.quickReplies || [])];
    quickReplies[index] = value;
    updateField('quickReplies', quickReplies);
  };

  const removeQuickReply = (index: number) => {
    const quickReplies = [...(nodeData.quickReplies || [])];
    quickReplies.splice(index, 1);
    updateField('quickReplies', quickReplies);
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={nodeData.triggerType || 'keyword'}
                onChange={(e) => updateField('triggerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="keyword">Keyword</option>
                <option value="welcome_message">Welcome Message</option>
                <option value="postback">Postback</option>
                <option value="schedule">Schedule</option>
                <option value="integration">Integration Event</option>
              </select>
            </div>

            {nodeData.triggerType === 'integration' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Integration Platform
                  </label>
                  <select
                    value={nodeData.integrationId || ''}
                    onChange={(e) => {
                      const selectedOption = e.target.options[e.target.selectedIndex];
                      updateField('integrationId', e.target.value);
                      updateField('integrationName', selectedOption.text);
                      updateField('integrationEvent', ''); // Reset event when platform changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Integration</option>
                    
                    {/* E-commerce */}
                    <optgroup label="E-commerce">
                      <option value="shopify">Shopify</option>
                      <option value="woocommerce">WooCommerce</option>
                      <option value="magento">Magento</option>
                      <option value="bigcommerce">BigCommerce</option>
                    </optgroup>
                    
                    {/* CRM */}
                    <optgroup label="CRM">
                      <option value="salesforce">Salesforce</option>
                      <option value="hubspot">HubSpot</option>
                      <option value="pipedrive">Pipedrive</option>
                      <option value="zoho">Zoho CRM</option>
                    </optgroup>
                    
                    {/* Productivity */}
                    <optgroup label="Productivity">
                      <option value="notion">Notion</option>
                      <option value="sheets">Google Sheets</option>
                      <option value="excel">Excel</option>
                      <option value="airtable">Airtable</option>
                    </optgroup>
                    
                    {/* Payment */}
                    <optgroup label="Payment">
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="razorpay">Razorpay</option>
                    </optgroup>
                    
                    {/* Marketing */}
                    <optgroup label="Marketing">
                      <option value="mailchimp">Mailchimp</option>
                      <option value="klaviyo">Klaviyo</option>
                      <option value="facebook-ads">Facebook Ads</option>
                      <option value="google-ads">Google Ads</option>
                    </optgroup>
                    
                    {/* Support */}
                    <optgroup label="Support">
                      <option value="zendesk">Zendesk</option>
                      <option value="freshdesk">Freshdesk</option>
                      <option value="intercom">Intercom</option>
                    </optgroup>
                  </select>
                </div>

                {nodeData.integrationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Event
                    </label>
                    <select
                      value={nodeData.integrationEvent || ''}
                      onChange={(e) => {
                        const selectedOption = e.target.options[e.target.selectedIndex];
                        updateField('integrationEvent', e.target.value);
                        updateField('integrationEventLabel', selectedOption.text);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Event</option>
                      {getIntegrationEvents(nodeData.integrationId).map((event) => (
                        <option key={event.value} value={event.value}>
                          {event.label}
                        </option>
                      ))}
                    </select>
                    
                    {nodeData.integrationEvent && (
                      <p className="mt-2 text-sm text-gray-500">
                        {getEventDescription(nodeData.integrationId, nodeData.integrationEvent)}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Make sure the integration is connected in the Integrations Marketplace before using this trigger.
                  </p>
                </div>
              </>
            )}

            {nodeData.triggerType === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="space-y-2">
                  {(nodeData.keywords || []).map((keyword: string, index: number) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateKeyword(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter keyword"
                      />
                      <button
                        onClick={() => removeKeyword(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addKeyword}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  >
                    + Add Keyword
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'sendMessage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text *
              </label>
              <textarea
                value={nodeData.messageText || ''}
                onChange={(e) => updateField('messageText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Enter your message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Replies (Optional)
              </label>
              <div className="space-y-2">
                {(nodeData.quickReplies || []).map((reply: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => updateQuickReply(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Quick reply text"
                    />
                    <button
                      onClick={() => removeQuickReply(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addQuickReply}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600"
                >
                  + Add Quick Reply
                </button>
              </div>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field to Check *
              </label>
              <select
                value={nodeData.conditionField || ''}
                onChange={(e) => updateField('conditionField', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select field...</option>
                <option value="user_message">User Message</option>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="email">Email</option>
                <option value="tags">User Tags</option>
                <option value="custom_field">Custom Field</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator *
              </label>
              <select
                value={nodeData.conditionOperator || ''}
                onChange={(e) => updateField('conditionOperator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select operator...</option>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Does Not Contain</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value to Compare
              </label>
              <input
                type="text"
                value={nodeData.conditionValue || ''}
                onChange={(e) => updateField('conditionValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter value..."
              />
            </div>
          </div>
        );

      case 'collectInput':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={nodeData.messageText || ''}
                onChange={(e) => updateField('messageText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="What would you like to ask?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Type *
              </label>
              <select
                value={nodeData.inputType || ''}
                onChange={(e) => updateField('inputType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select type...</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone Number</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variable Name *
              </label>
              <input
                type="text"
                value={nodeData.variableName || ''}
                onChange={(e) => updateField('variableName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., user_email, customer_name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use this name to reference the value in other messages
              </p>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL *
              </label>
              <input
                type="url"
                value={nodeData.webhookUrl || ''}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://your-server.com/webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={nodeData.webhookMethod || 'POST'}
                onChange={(e) => updateField('webhookMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data to Send (JSON)
              </label>
              <textarea
                value={nodeData.webhookDataString || JSON.stringify(nodeData.webhookData || {}, null, 2)}
                onChange={(e) => {
                  updateField('webhookDataString', e.target.value);
                  try {
                    const data = JSON.parse(e.target.value);
                    updateField('webhookData', data);
                  } catch {
                    // Invalid JSON, keep the string for editing
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                rows={6}
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        );

      case 'aiResponse':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Prompt *
              </label>
              <textarea
                value={nodeData.aiPrompt || ''}
                onChange={(e) => updateField('aiPrompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="How should the AI respond? Be specific about tone and style."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={nodeData.aiContext || ''}
                onChange={(e) => updateField('aiContext', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Additional context about your business, products, or services..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fallback Message
              </label>
              <input
                type="text"
                value={nodeData.fallbackMessage || ''}
                onChange={(e) => updateField('fallbackMessage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Message to send if AI fails"
              />
            </div>
          </div>
        );

      case 'addTag':
      case 'removeTag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags to {node.type === 'addTag' ? 'Add' : 'Remove'}
              </label>
              <input
                type="text"
                value={(nodeData.tags || []).join(', ')}
                onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Amount
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={nodeData.delayValue || 1}
                  onChange={(e) => updateField('delayValue', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
                <select
                  value={nodeData.delayUnit || 'minutes'}
                  onChange={(e) => updateField('delayUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>No editor available for this node type</p>
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {getNodeTypeLabel(node.type!)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">Validation Errors</span>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {renderEditor()}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trigger: 'Trigger',
    sendMessage: 'Message',
    condition: 'Condition',
    collectInput: 'Input Collection',
    webhook: 'Webhook',
    aiResponse: 'AI Response',
    addTag: 'Add Tag',
    removeTag: 'Remove Tag',
    delay: 'Delay',
  };
  return labels[type] || 'Node';
}

function getNodeLabel(type: string, data: any): string {
  switch (type) {
    case 'trigger':
      if (data.triggerType === 'integration' && data.integrationName) {
        const eventLabel = data.integrationEventLabel || data.integrationEvent || 'event';
        return `Trigger: ${data.integrationName} - ${eventLabel}`;
      }
      if (data.triggerType === 'keyword' && data.keywords?.length > 0) {
        return `Trigger: ${data.keywords.slice(0, 2).join(', ')}${data.keywords.length > 2 ? '...' : ''}`;
      }
      return `Trigger: ${data.triggerType || 'Keyword'}`;
    case 'sendMessage':
      return data.messageText?.substring(0, 30) + (data.messageText?.length > 30 ? '...' : '') || 'Send Message';
    case 'condition':
      return `If ${data.conditionField || 'field'} ${data.conditionOperator || 'equals'} ${data.conditionValue || 'value'}`;
    case 'collectInput':
      return `Collect ${data.inputType || 'input'}: ${data.variableName || 'variable'}`;
    case 'webhook':
      return `Webhook: ${data.webhookMethod || 'POST'}`;
    case 'aiResponse':
      return 'AI Response';
    case 'addTag':
      return `Add Tags: ${data.tags?.join(', ') || 'none'}`;
    case 'removeTag':
      return `Remove Tags: ${data.tags?.join(', ') || 'none'}`;
    case 'delay':
      return `Delay ${data.delayValue || 1} ${data.delayUnit || 'minutes'}`;
    default:
      return 'Node';
  }
}

export default NodeEditor;