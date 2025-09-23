/**
 * NodePalette - Draggable node palette for automation flow builder
 * Contains all available node types organized by category
 */

'use client';

import React, { useState } from 'react';

interface NodeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  nodes: NodeType[];
}

interface NodeType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: string;
}

const nodeCategories: NodeCategory[] = [
  {
    id: 'triggers',
    name: 'Triggers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
      </svg>
    ),
    nodes: [
      {
        id: 'keyword-trigger',
        name: 'Keyword Trigger',
        description: 'Start automation when user sends specific keywords',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        color: 'bg-blue-500',
        type: 'trigger'
      },
      {
        id: 'welcome-trigger',
        name: 'Welcome Message',
        description: 'Trigger when user first contacts you',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        color: 'bg-green-500',
        type: 'trigger'
      }
    ]
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    nodes: [
      {
        id: 'send-message',
        name: 'Send Message',
        description: 'Send text message with optional quick replies',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        color: 'bg-indigo-500',
        type: 'sendMessage'
      },
      {
        id: 'collect-input',
        name: 'Collect Input',
        description: 'Ask user for information and store response',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'bg-purple-500',
        type: 'collectInput'
      },
      {
        id: 'ai-response',
        name: 'AI Response',
        description: 'Generate AI-powered responses',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        color: 'bg-pink-500',
        type: 'aiResponse'
      }
    ]
  },
  {
    id: 'logic',
    name: 'Logic & Flow',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    nodes: [
      {
        id: 'condition',
        name: 'Condition',
        description: 'Create if/else logic based on user data',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        ),
        color: 'bg-yellow-500',
        type: 'condition'
      },
      {
        id: 'delay',
        name: 'Delay',
        description: 'Wait before continuing the flow',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'bg-orange-500',
        type: 'delay'
      }
    ]
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    nodes: [
      {
        id: 'add-tag',
        name: 'Add Tag',
        description: 'Add tags to organize and segment users',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        color: 'bg-green-600',
        type: 'addTag'
      },
      {
        id: 'remove-tag',
        name: 'Remove Tag',
        description: 'Remove tags from user',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        color: 'bg-red-500',
        type: 'removeTag'
      },
      {
        id: 'webhook',
        name: 'Webhook',
        description: 'Send data to external services',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        ),
        color: 'bg-cyan-500',
        type: 'webhook'
      }
    ]
  }
];

const NodePalette: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string>('messages');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? '' : categoryId);
  };

  return (
    <div className="p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Node Palette</h4>
      
      <div className="space-y-2">
        {nodeCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 rounded-t-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="text-gray-500">{category.icon}</div>
                <span className="text-sm font-medium text-gray-700">
                  {category.name}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transform transition-transform ${
                  expandedCategory === category.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedCategory === category.id && (
              <div className="px-2 pb-2 space-y-1">
                {category.nodes.map((node) => (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type)}
                    className="p-3 border border-gray-200 rounded-md cursor-move hover:border-indigo-300 hover:shadow-sm transition-all bg-white"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 ${node.color} rounded-md flex items-center justify-center text-white`}>
                        {node.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {node.name}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1 leading-tight">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h6 className="text-sm font-medium text-blue-900">How to use</h6>
            <p className="text-xs text-blue-700 mt-1">
              Drag nodes from this palette onto the canvas to build your automation flow. 
              Connect nodes by dragging from the connection points.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h6 className="text-sm font-medium text-gray-900 mb-2">Quick Tips</h6>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Start with a trigger node</li>
          <li>• Use conditions for branching logic</li>
          <li>• Test your flow before publishing</li>
          <li>• Add tags to organize users</li>
        </ul>
      </div>
    </div>
  );
};

export default NodePalette;