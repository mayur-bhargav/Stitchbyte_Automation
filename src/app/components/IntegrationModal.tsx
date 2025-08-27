"use client";

import React from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  status: 'available' | 'coming-soon' | 'connected';
  color: string;
}

interface IntegrationModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ 
  integration, 
  isOpen, 
  onClose, 
  children 
}) => {
  if (!isOpen || !integration) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-xl">
                {integration.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{integration.name}</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {integration.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{integration.description}</p>
          {children}
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;
