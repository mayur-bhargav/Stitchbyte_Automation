"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  MdClose,
  MdSave,
  MdAdd,
  MdDelete,
  MdEdit,
  MdArrowForward,
  MdSettings,
  MdVisibility,
  MdZoomIn,
  MdZoomOut,
  MdCenterFocusStrong,
  MdFlashOn,
  MdMessage,
  MdInput,
  MdBuild,
  MdPlayArrow,
  MdPause,
  MdRefresh,
  MdCode
} from "react-icons/md";

// Enhanced Types for Dynamic Flow Builder
type FlowStepType = 'trigger' | 'message' | 'condition' | 'data_input' | 'api_call' | 'webhook' | 'delay' | 'custom_action' | 'branch';

type FlowStep = {
  id: string;
  type: FlowStepType;
  title: string;
  config: any;
  position: { x: number; y: number };
  connections: string[]; // Array of step IDs this connects to
};

type Connection = {
  from: string;
  to: string;
  label?: string;
};

interface DynamicAutomationBuilderProps {
  template?: any;
  onClose: () => void;
  onSave: (automation: any) => void;
}

export default function DynamicAutomationBuilder({ template, onClose, onSave }: DynamicAutomationBuilderProps) {
  const [formData, setFormData] = useState({
    name: template?.name || "New Automation",
    description: template?.description || "",
    status: "draft"
  });
  
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drag functionality at component level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedStepId) {
        const newPosition = {
          x: Math.max(0, e.clientX - dragStart.x),
          y: Math.max(0, e.clientY - dragStart.y)
        };
        updateStep(draggedStepId, { position: newPosition });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedStepId(null);
    };
    
    if (isDragging && draggedStepId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedStepId, dragStart]);
  
  // Step Templates
  const stepTemplates = [
    { type: 'trigger', title: 'Trigger', icon: MdFlashOn, color: 'bg-purple-500' },
    { type: 'message', title: 'Send Message', icon: MdMessage, color: 'bg-blue-500' },
    { type: 'condition', title: 'Condition/Branch', icon: MdCode, color: 'bg-yellow-500' },
    { type: 'data_input', title: 'Collect Data', icon: MdInput, color: 'bg-green-500' },
    { type: 'api_call', title: 'API Call', icon: MdBuild, color: 'bg-red-500' },
    { type: 'webhook', title: 'Webhook', icon: MdRefresh, color: 'bg-indigo-500' },
    { type: 'delay', title: 'Delay/Wait', icon: MdPause, color: 'bg-gray-500' },
    { type: 'custom_action', title: 'Custom Action', icon: MdSettings, color: 'bg-pink-500' },
  ];
  
  // Initialize with a trigger step
  useEffect(() => {
    if (flowSteps.length === 0) {
      const triggerStep: FlowStep = {
        id: 'trigger_' + Date.now(),
        type: 'trigger',
        title: 'Start Trigger',
        config: {
          type: 'keyword',
          keywords: ['start', 'hello']
        },
        position: { x: 50, y: 100 }, // Start at grid position
        connections: []
      };
      setFlowSteps([triggerStep]);
    }
  }, [flowSteps]);
  
  const addStep = (stepType: FlowStepType) => {
    // Calculate position to avoid overlaps
    const existingPositions = flowSteps.map(step => step.position);
    let newPosition = { x: 300, y: 150 };
    
    // Simple grid positioning to avoid overlaps
    const gridSize = 280; // Width + margin between steps
    const rowHeight = 200; // Height + margin between rows
    const stepsPerRow = 4;
    
    const stepIndex = flowSteps.length;
    const row = Math.floor(stepIndex / stepsPerRow);
    const col = stepIndex % stepsPerRow;
    
    newPosition = {
      x: 50 + (col * gridSize),
      y: 100 + (row * rowHeight)
    };
    
    const newStep: FlowStep = {
      id: stepType + '_' + Date.now(),
      type: stepType,
      title: stepTemplates.find(t => t.type === stepType)?.title || stepType,
      config: getDefaultConfig(stepType),
      position: newPosition,
      connections: []
    };
    
    setFlowSteps([...flowSteps, newStep]);
    setSelectedStepId(newStep.id);
  };
  
  const getDefaultConfig = (stepType: FlowStepType) => {
    switch (stepType) {
      case 'trigger':
        return { type: 'keyword', keywords: [] };
      case 'message':
        return { message: '', buttons: [] };
      case 'condition':
        return { condition: '', true_path: [], false_path: [] };
      case 'data_input':
        return { fields: [], storage: { type: 'google_sheets' } };
      case 'api_call':
        return { url: '', method: 'GET', headers: {}, body: {} };
      case 'webhook':
        return { url: '', method: 'POST', payload: {} };
      case 'delay':
        return { duration: 5, unit: 'minutes' };
      default:
        return {};
    }
  };
  
  const deleteStep = (stepId: string) => {
    setFlowSteps(flowSteps.filter(step => step.id !== stepId));
    setConnections(connections.filter(conn => conn.from !== stepId && conn.to !== stepId));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };
  
  const updateStep = (stepId: string, updates: Partial<FlowStep>) => {
    setFlowSteps(flowSteps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };
  
  const startConnection = (fromStepId: string) => {
    // console.log('Starting connection from:', fromStepId);
    setIsConnecting(true);
    setConnectingFrom(fromStepId);
  };
  
  const completeConnection = (toStepId: string) => {
    // console.log('Completing connection to:', toStepId, 'from:', connectingFrom);
    if (connectingFrom && connectingFrom !== toStepId) {
      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        conn.from === connectingFrom && conn.to === toStepId
      );
      
      if (!existingConnection) {
        const newConnection: Connection = {
          from: connectingFrom,
          to: toStepId
        };
        setConnections([...connections, newConnection]);
        
        // Update source step connections
        const sourceStep = flowSteps.find(s => s.id === connectingFrom);
        if (sourceStep) {
          updateStep(connectingFrom, {
            connections: [...(sourceStep.connections || []), toStepId]
          });
        }
        // console.log('Connection created:', newConnection);
      } else {
        // console.log('Connection already exists');
      }
    }
    
    setIsConnecting(false);
    setConnectingFrom(null);
  };
  
  const removeConnection = (from: string, to: string) => {
    setConnections(connections.filter(conn => !(conn.from === from && conn.to === to)));
    const sourceStep = flowSteps.find(s => s.id === from);
    if (sourceStep) {
      updateStep(from, {
        connections: sourceStep.connections.filter(id => id !== to)
      });
    }
  };
  
  const getStepIcon = (stepType: FlowStepType) => {
    const template = stepTemplates.find(t => t.type === stepType);
    return template?.icon || MdSettings;
  };
  
  const getStepColor = (stepType: FlowStepType) => {
    const template = stepTemplates.find(t => t.type === stepType);
    return template?.color || 'bg-gray-500';
  };
  
  const renderStep = (step: FlowStep) => {
    const Icon = getStepIcon(step.type);
    const isSelected = selectedStepId === step.id;
    const isConnecting = connectingFrom === step.id;
    const isDraggedStep = draggedStepId === step.id;
    
    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.step-header')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDraggedStepId(step.id);
        setDragStart({
          x: e.clientX - step.position.x,
          y: e.clientY - step.position.y
        });
      }
    };
    
    return (
      <div
        key={step.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'scale-105 z-30' : 'z-10'
        } ${isDraggedStep ? 'cursor-grabbing z-40' : 'cursor-grab'}`}
        style={{
          left: step.position.x,
          top: step.position.y,
          transform: `scale(${canvasZoom})`,
          transformOrigin: 'top left'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isConnecting && connectingFrom !== step.id) {
            completeConnection(step.id);
          } else {
            setSelectedStepId(step.id);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Double click can also be used for connections
          if (isConnecting && connectingFrom !== step.id) {
            completeConnection(step.id);
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={`bg-white rounded-xl shadow-lg border-2 min-w-[200px] transition-all ${
          isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
        } ${isConnecting && connectingFrom !== step.id ? 'ring-2 ring-green-400 ring-opacity-75 border-green-300' : ''} ${
          isConnecting && connectingFrom === step.id ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''
        } ${
          isDraggedStep ? 'shadow-2xl' : ''
        }`}>
          {/* Step Header */}
          <div className={`step-header ${getStepColor(step.type)} text-white p-3 rounded-t-xl flex items-center justify-between cursor-grab`}>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{step.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startConnection(step.id);
                }}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                title="Connect to another step"
              >
                <MdArrowForward className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStep(step.id);
                }}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                title="Delete step"
              >
                <MdDelete className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Step Content Preview */}
          <div className="p-3">
            {step.type === 'message' ? (
              <div className="text-xs text-gray-600">
                {renderStepPreview(step)}
              </div>
            ) : (
              <div className="text-xs text-gray-600">
                {renderStepPreview(step)}
              </div>
            )}
            
            {/* Connection Points */}
            {step.connections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Connected to: {step.connections.length} step(s)
                </div>
              </div>
            )}
          </div>
          
          {/* Connection Handles */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderStepPreview = (step: FlowStep) => {
    switch (step.type) {
      case 'trigger':
        return `Trigger: ${step.config.type} - ${step.config.keywords?.join(', ') || 'Not configured'}`;
      case 'message':
        return renderWhatsAppMessagePreview(step);
      case 'condition':
        return `Condition: ${step.config.condition || 'No condition set'}`;
      case 'data_input':
        return `Collect: ${step.config.fields?.length || 0} fields`;
      case 'api_call':
        return `API: ${step.config.method || 'GET'} ${step.config.url || 'No URL'}`;
      case 'webhook':
        return `Webhook: ${step.config.url || 'No URL set'}`;
      case 'delay':
        return `Wait: ${step.config.duration || 0} ${step.config.unit || 'minutes'}`;
      default:
        return 'Custom configuration';
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'doc': return '📝';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '📎';
    }
  };

  const renderWhatsAppMessagePreview = (step: FlowStep) => {
    const message = step.config.message || 'No message set';
    const buttons = step.config.buttons || [];
    const attachments = step.config.attachments || [];
    
    // console.log('🔍 Rendering WhatsApp preview:', { message, buttons, attachments });
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-xs">
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{getAttachmentIcon(attachments[0].type || 'pdf')}</span>
              <span className="font-medium">Attachment:</span>
              <span>[{attachments[0].type?.toUpperCase() || 'FILE'}] {attachments[0].name || 'Document'}</span>
              <span>📥</span>
            </div>
          </div>
        )}
        
        {/* Message Text */}
        <div className="text-sm text-gray-900 mb-3 leading-relaxed">
          {message}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-500 mb-3">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        {/* Interactive Buttons */}
        {buttons.length > 0 && (
          <div className="space-y-2">
            {buttons.map((button: any, index: number) => (
              <div
                key={index}
                className="relative group"
              >
                {/* Connection Dots for Buttons */}
                <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle button input connection
                    // console.log('Connect button input:', button.text);
                  }}
                  title="Connect input to this button"
                ></div>
                
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle button output connection
                    if (button.type === 'automation') {
                      startConnection(`${step.id}_button_${index}`);
                    }
                  }}
                  title="Connect output from this button"
                ></div>
                
                <div className={`border border-gray-300 rounded-lg p-2 text-center text-sm cursor-pointer transition-all hover:bg-gray-50 ${
                  button.type === 'link' 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {button.type === 'link' ? '🔗' : '⚡'}
                    <span className="font-medium">{button.text || 'Button'}</span>
                  </div>
                  
                  {/* Button Action Indicator */}
                  <div className="text-xs mt-1 opacity-75">
                    {button.type === 'link' 
                      ? `→ ${button.url || 'No URL'}` 
                      : `→ Next Automation`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderConnections = () => {
    if (!canvasRef.current) return null;

    return connections.map((connection, index) => {
      const fromStep = flowSteps.find(s => s.id === connection.from);
      const toStep = flowSteps.find(s => s.id === connection.to);
      
      if (!fromStep || !toStep) return null;
      
      // Calculate connection points (right side of source, left side of target)
      const stepWidth = 200;
      const stepHeight = 120;
      
      const fromX = fromStep.position.x + stepWidth; // Right side of source step
      const fromY = fromStep.position.y + (stepHeight / 2); // Middle height
      const toX = toStep.position.x; // Left side of target step
      const toY = toStep.position.y + (stepHeight / 2); // Middle height
      
      // Create curved path for better visual
      const controlPointOffset = Math.abs(toX - fromX) * 0.3;
      const controlPoint1X = fromX + controlPointOffset;
      const controlPoint1Y = fromY;
      const controlPoint2X = toX - controlPointOffset;
      const controlPoint2Y = toY;
      
      const pathD = `M ${fromX} ${fromY} 
                    C ${controlPoint1X} ${controlPoint1Y}, 
                      ${controlPoint2X} ${controlPoint2Y}, 
                      ${toX} ${toY}`;
      
      return (
        <svg
          key={index}
          className="absolute pointer-events-none top-0 left-0 w-full h-full"
          style={{
            zIndex: 5,
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'top left'
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${index}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6366f1"
              />
            </marker>
            
            {/* Drop shadow filter */}
            <filter id={`shadow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.2)"/>
            </filter>
          </defs>
          
          {/* Connection path */}
          <path
            d={pathD}
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#arrowhead-${index})`}
            filter={`url(#shadow-${index})`}
            className="transition-all duration-200"
          />
          
          {/* Connection label if needed */}
          {connection.label && (
            <text
              x={(fromX + toX) / 2}
              y={(fromY + toY) / 2 - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600 font-medium"
              style={{ fontSize: '12px' }}
            >
              {connection.label}
            </text>
          )}
        </svg>
      );
    });
  };
  
  const renderStepConfigForm = (step: FlowStep) => {
    const updateConfig = (newConfig: any) => {
      updateStep(step.id, { config: newConfig });
    };

    switch (step.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={step.config.type || 'keyword'}
                onChange={(e) => updateConfig({ ...step.config, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="keyword">Keyword Trigger</option>
                <option value="schedule">Schedule Trigger</option>
                <option value="webhook">Webhook Trigger</option>
              </select>
            </div>
            {step.config.type === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={step.config.keywords?.join(', ') || ''}
                  onChange={(e) => updateConfig({ 
                    ...step.config, 
                    keywords: e.target.value.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="hello, start, help"
                />
              </div>
            )}
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Attachments (Optional)
              </label>
              {step.config.attachments?.map((attachment: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={attachment.name || ''}
                        onChange={(e) => {
                          const newAttachments = [...(step.config.attachments || [])];
                          newAttachments[index] = { ...attachment, name: e.target.value };
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Attachment name (e.g., Invoice_Feb_2024)"
                      />
                      <select
                        value={attachment.type || 'pdf'}
                        onChange={(e) => {
                          const newAttachments = [...(step.config.attachments || [])];
                          newAttachments[index] = { ...attachment, type: e.target.value };
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="pdf">PDF</option>
                        <option value="image">Image</option>
                        <option value="doc">Document</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                      <button
                        onClick={() => {
                          const newAttachments = step.config.attachments?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove attachment"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <input
                        type="url"
                        value={attachment.url || ''}
                        onChange={(e) => {
                          const newAttachments = [...(step.config.attachments || [])];
                          newAttachments[index] = { ...attachment, url: e.target.value };
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="File URL or upload link"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newAttachments = [...(step.config.attachments || []), { 
                    name: '', 
                    type: 'pdf', 
                    url: '' 
                  }];
                  updateConfig({ ...step.config, attachments: newAttachments });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MdAdd className="w-4 h-4" />
                Add Attachment
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text
              </label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => updateConfig({ ...step.config, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔘 Add Interactive Buttons (Optional)
              </label>
              {step.config.buttons?.map((button: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    {/* Button Text */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={button.text || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, text: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Button text"
                      />
                      <button
                        onClick={() => {
                          const newButtons = step.config.buttons?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete button"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Button Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Button Type
                      </label>
                      <select
                        value={button.type || 'link'}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { 
                            ...button, 
                            type: e.target.value,
                            // Reset type-specific fields when changing type
                            ...(e.target.value === 'link' ? { url: '', automation_id: undefined } : { automation_id: '', url: undefined })
                          };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="link">Link Button (Opens URL)</option>
                        <option value="automation">Automation Button (Connects to next step)</option>
                      </select>
                    </div>

                    {/* Button Action Configuration */}
                    {button.type === 'link' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Link URL
                        </label>
                        <input
                          type="url"
                          value={button.url || ''}
                          onChange={(e) => {
                            const newButtons = [...(step.config.buttons || [])];
                            newButtons[index] = { ...button, url: e.target.value };
                            updateConfig({ ...step.config, buttons: newButtons });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {button.type === 'automation' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 bg-green-50 p-2 rounded flex items-center gap-2">
                          ⚡ <span>This button will connect to the next automation step when clicked</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <MdArrowForward className="w-3 h-3" />
                          <span>Use the connection dot on the right to link to another step</span>
                        </div>
                      </div>
                    )}

                    {/* Button Preview */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Preview:</div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs border ${
                        button.type === 'link' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {button.type === 'link' ? '🔗' : '⚡'} {button.text || 'Button'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newButtons = [...(step.config.buttons || []), { 
                    text: '', 
                    type: 'link', 
                    url: '',
                    action: 'button_click' 
                  }];
                  updateConfig({ ...step.config, buttons: newButtons });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MdAdd className="w-4 h-4" />
                Add Interactive Button
              </button>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <textarea
                value={step.config.condition || ''}
                onChange={(e) => updateConfig({ ...step.config, condition: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., user_input contains 'yes'"
              />
            </div>
            <div className="text-sm text-gray-500">
              This step will branch based on the condition result (true/false)
            </div>
          </div>
        );

      case 'data_input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fields to Collect
              </label>
              {step.config.fields?.map((field: any, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={field.name || ''}
                    onChange={(e) => {
                      const newFields = [...(step.config.fields || [])];
                      newFields[index] = { ...field, name: e.target.value };
                      updateConfig({ ...step.config, fields: newFields });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Field name (e.g., name, email)"
                  />
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => {
                      const newFields = [...(step.config.fields || [])];
                      newFields[index] = { ...field, type: e.target.value };
                      updateConfig({ ...step.config, fields: newFields });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    onClick={() => {
                      const newFields = step.config.fields?.filter((_: any, i: number) => i !== index) || [];
                      updateConfig({ ...step.config, fields: newFields });
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newFields = [...(step.config.fields || []), { name: '', type: 'text', required: true }];
                  updateConfig({ ...step.config, fields: newFields });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MdAdd className="w-4 h-4" />
                Add Field
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Type
              </label>
              <select
                value={step.config.storage?.type || 'google_sheets'}
                onChange={(e) => updateConfig({ 
                  ...step.config, 
                  storage: { ...step.config.storage, type: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="google_sheets">Google Sheets</option>
                <option value="database">Database</option>
                <option value="csv">CSV File</option>
              </select>
            </div>
          </div>
        );

      case 'api_call':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={step.config.url || ''}
                onChange={(e) => updateConfig({ ...step.config, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Method
              </label>
              <select
                value={step.config.method || 'GET'}
                onChange={(e) => updateConfig({ ...step.config, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers (JSON format)
              </label>
              <textarea
                value={JSON.stringify(step.config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    updateConfig({ ...step.config, headers });
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>
            {(step.config.method === 'POST' || step.config.method === 'PUT') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Body (JSON format)
                </label>
                <textarea
                  value={JSON.stringify(step.config.body || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value);
                      updateConfig({ ...step.config, body });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={step.config.url || ''}
                onChange={(e) => updateConfig({ ...step.config, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://webhook.site/your-unique-url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload (JSON format)
              </label>
              <textarea
                value={JSON.stringify(step.config.payload || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const payload = JSON.parse(e.target.value);
                    updateConfig({ ...step.config, payload });
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                placeholder='{"message": "Automation triggered", "data": "{{user_data}}"}'
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={step.config.duration || 5}
                  onChange={(e) => updateConfig({ ...step.config, duration: parseInt(e.target.value) || 5 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="5"
                />
                <select
                  value={step.config.unit || 'minutes'}
                  onChange={(e) => updateConfig({ ...step.config, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              The automation will pause for this duration before continuing to the next step.
            </div>
          </div>
        );

      case 'custom_action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={step.config.actionType || 'custom'}
                onChange={(e) => updateConfig({ ...step.config, actionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="custom">Custom Code</option>
                <option value="email">Send Email</option>
                <option value="sms">Send SMS</option>
                <option value="notification">Push Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration
              </label>
              <textarea
                value={step.config.config || ''}
                onChange={(e) => updateConfig({ ...step.config, config: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter configuration details..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            No configuration options available for this step type.
          </div>
        );
    }
  };
  
  const handleSave = async () => {
    const automationData = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      workflow: flowSteps,
      connections: connections,
      created_at: new Date().toISOString()
    };
    
    // console.log('Saving automation:', automationData);
    onSave(automationData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dynamic Automation Builder</h2>
              <p className="text-gray-600 mt-1">Create custom workflows with unlimited steps and connections</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'builder' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Builder
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'preview' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MdVisibility className="w-4 h-4 mr-2 inline" />
                  Live Preview
                </button>
              </div>
              
              <button
                onClick={handleSave}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <MdSave className="w-4 h-4" />
                Save Automation
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Automation Details */}
          <div className="mt-4 flex items-center gap-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
              placeholder="Automation name..."
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-gray-600 bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 flex-1"
              placeholder="Add description..."
            />
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar - Step Library */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Add Steps</h3>
            <div className="space-y-2">
              {stepTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.type}
                    onClick={() => addStep(template.type as FlowStepType)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{template.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'builder' ? (
                <div
                  ref={canvasRef}
                  className="w-full h-full bg-gray-100 relative cursor-move"
                  style={{
                    backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                >
                  {/* Canvas Controls */}
                  <div className="absolute top-4 right-4 z-30 flex gap-2">
                    <button
                      onClick={() => setCanvasZoom(Math.min(canvasZoom + 0.1, 2))}
                      className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                    >
                      <MdZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCanvasZoom(Math.max(canvasZoom - 0.1, 0.5))}
                      className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                    >
                      <MdZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCanvasZoom(1);
                        setCanvasPosition({ x: 0, y: 0 });
                      }}
                      className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                    >
                      <MdCenterFocusStrong className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Connection Lines */}
                  {renderConnections()}
                  
                  {/* Flow Steps */}
                  {flowSteps.map(renderStep)}
                  
                  {/* Connection Helper */}
                  {isConnecting && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                      <MdArrowForward className="w-4 h-4" />
                      <span>Click on another step to connect from "{flowSteps.find(s => s.id === connectingFrom)?.title}"</span>
                      <button
                        onClick={() => {
                          setIsConnecting(false);
                          setConnectingFrom(null);
                        }}
                        className="ml-2 text-yellow-800 hover:text-yellow-900"
                      >
                        <MdClose className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-white p-6 overflow-auto">
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h3>
                    
                    {/* Preview Content */}
                    <div className="space-y-4">
                      {flowSteps.map((step, index) => (
                        <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 ${getStepColor(step.type)} rounded-lg flex items-center justify-center`}>
                              {React.createElement(getStepIcon(step.type), { className: "w-4 h-4 text-white" })}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{step.title}</div>
                              <div className="text-sm text-gray-500">Step {index + 1}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {renderStepPreview(step)}
                          </div>
                          
                          {step.connections.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <MdArrowForward className="w-3 h-3" />
                                Connects to {step.connections.length} step(s)
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Step Configuration */}
            {selectedStepId && (
              <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-auto">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Configure Step</h3>
                  {(() => {
                    const selectedStep = flowSteps.find(s => s.id === selectedStepId);
                    if (!selectedStep) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Step Title
                          </label>
                          <input
                            type="text"
                            value={selectedStep.title}
                            onChange={(e) => updateStep(selectedStepId, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Enter step title..."
                          />
                        </div>
                        
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          Step type: <span className="font-medium">{selectedStep.type}</span>
                        </div>
                        
                        {/* Step-specific configuration forms */}
                        {renderStepConfigForm(selectedStep)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}