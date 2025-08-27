"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface ShopifyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_price: string;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  created_at: string;
  status: string;
}

interface ShopifyEvent {
  deduplication_id: string;
  event_timestamp: string;
  standard_payload: {
    order: ShopifyOrder;
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      price: string;
    }>;
  };
}

const ShopifyEvents: React.FC = () => {
  const [events, setEvents] = useState<ShopifyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError('');
      const response = await apiService.get('/connectors/shopify/events?limit=20');
      setEvents(response.events || []);
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      setError('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = () => {
    setLoading(true);
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2A8B8A] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading recent orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Shopify Orders</h3>
        <button
          onClick={refreshEvents}
          className="text-[#2A8B8A] hover:text-[#238080] transition-colors"
          title="Refresh orders"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-500 mb-2">No orders received yet</p>
          <p className="text-sm text-gray-400">Orders will appear here when customers make purchases from your Shopify store</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div key={event.deduplication_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Order #{event.standard_payload.order.order_number}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {event.standard_payload.customer.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {event.standard_payload.order.currency} {event.standard_payload.order.total_price}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.event_timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Items ordered:</p>
                <div className="space-y-1">
                  {event.standard_payload.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {item.name} <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="text-gray-700">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {event.standard_payload.customer.email && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Customer: {event.standard_payload.customer.email}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing {events.length} most recent orders
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopifyEvents;
