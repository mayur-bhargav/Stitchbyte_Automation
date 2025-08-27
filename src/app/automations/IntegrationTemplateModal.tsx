"use client";

import React from 'react';
import { IntegrationTemplate } from './integrationTemplates';
import { 
  MdClose, 
  MdRocket, 
  MdCheckCircle, 
  MdSettings,
  MdPlayArrow,
  MdNotifications,
  MdDataUsage,
  MdAutoAwesome
} from 'react-icons/md';

interface IntegrationTemplateModalProps {
  template: IntegrationTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateAutomation: (template: IntegrationTemplate) => void;
}

const IntegrationTemplateModal: React.FC<IntegrationTemplateModalProps> = ({
  template,
  isOpen,
  onClose,
  onCreateAutomation
}) => {
  if (!isOpen || !template) return null;

  const renderIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MdShoppingCart: require('react-icons/md').MdShoppingCart,
      MdPersonAdd: require('react-icons/md').MdPersonAdd,
      MdTrendingUp: require('react-icons/md').MdTrendingUp,
      MdSupport: require('react-icons/md').MdSupport,
      MdEmail: require('react-icons/md').MdEmail,
      MdPayment: require('react-icons/md').MdPayment,
      MdEvent: require('react-icons/md').MdEvent,
      MdAnalytics: require('react-icons/md').MdAnalytics,
      MdAutoAwesome: require('react-icons/md').MdAutoAwesome,
      MdChat: require('react-icons/md').MdChat
    };
    const IconComponent = icons[iconName] || MdAutoAwesome;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${template.color} flex items-center justify-center text-white rounded-xl`}>
                {renderIcon(template.icon)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                <p className="text-gray-600">{template.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Integration Info */}
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MdDataUsage className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Integration Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Platform</p>
                <p className="text-blue-700 capitalize">{template.trigger.platform}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Trigger Event</p>
                <p className="text-blue-700">{template.trigger.event.replace('_', ' ')}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-blue-800 mb-1">How it works</p>
                <p className="text-blue-700">{template.trigger.description}</p>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <MdSettings className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Automation Workflow</h3>
            </div>
            <div className="space-y-4">
              {template.workflow.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#2A8B8A] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {step.action.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                    {step.template && (
                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-[#2A8B8A]">
                        <p className="text-sm font-medium text-gray-700 mb-1">Message Template:</p>
                        <p className="text-sm text-gray-600 italic">"{step.template}"</p>
                      </div>
                    )}
                    {step.variables && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Available Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {step.variables.map((variable, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <MdRocket className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Benefits</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {template.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <MdCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Requirements */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MdNotifications className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-900">Setup Requirements</h3>
            </div>
            <ul className="space-y-2 text-yellow-800">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span>Active {template.trigger.platform} account</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span>Webhook endpoint configuration (we'll guide you through this)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span>WhatsApp Business Account connected to StitchByte</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                This automation will be created as a draft. You can customize it before activating.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreateAutomation(template)}
                className="flex items-center gap-2 px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors"
              >
                <MdPlayArrow className="w-4 h-4" />
                Create Automation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationTemplateModal;
