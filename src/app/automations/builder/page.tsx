"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from "../../contexts/UserContext";
import { apiService } from "../../services/apiService";
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
  MdCode,
  MdArrowBack
} from "react-icons/md";

// Get API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

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
  fromButton?: number; // Index of the button if connection starts from a button
};

export default function AutomationBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    name: "New Automation",
    description: "",
    status: "draft"
  });
  
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingFromButton, setConnectingFromButton] = useState<number | null>(null);
  
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Debug connections changes
  useEffect(() => {
    console.log('Connections state changed:', connections);
  }, [connections]);

  // Debug connection state changes
  useEffect(() => {
    console.log('Connection state changed - isConnecting:', isConnecting, 'connectingFrom:', connectingFrom);
  }, [isConnecting, connectingFrom]);

  // Load existing automation if editing
  useEffect(() => {
    const automationId = searchParams.get('id');
    const templateId = searchParams.get('template');
    
    if (automationId) {
      // Load existing automation for editing
      loadAutomation(automationId);
    } else if (templateId) {
      // Load from template
      loadTemplate(templateId);
    }
  }, [searchParams]);
  
  const loadAutomation = async (id: string) => {
    try {
      // TODO: Load automation from backend
      console.log('Loading automation:', id);
    } catch (error) {
      console.error('Error loading automation:', error);
    }
  };
  
  const loadTemplate = async (templateId: string) => {
    try {
      // TODO: Load template from backend
      console.log('Loading template:', templateId);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };
  
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
        return { message: '', buttons: [], attachments: [] };
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
  
  const startConnection = (fromStepId: string, fromButtonIndex?: number) => {
    console.log('startConnection called with:', fromStepId, 'button:', fromButtonIndex);
    console.log('Before setting state - isConnecting:', isConnecting, 'connectingFrom:', connectingFrom);
    setIsConnecting(true);
    setConnectingFrom(fromStepId);
    setConnectingFromButton(fromButtonIndex !== undefined ? fromButtonIndex : null);
    console.log('After setting state - should be true and', fromStepId, 'button:', fromButtonIndex);
  };
  
  const completeConnection = (toStepId: string) => {
    console.log('Completing connection to:', toStepId, 'from:', connectingFrom, 'button:', connectingFromButton);
    console.log('Current connections:', connections);
    console.log('Current flow steps:', flowSteps);
    
    if (connectingFrom && connectingFrom !== toStepId) {
      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        conn.from === connectingFrom && 
        conn.to === toStepId && 
        conn.fromButton === connectingFromButton
      );
      
      if (!existingConnection) {
        const newConnection: Connection = {
          from: connectingFrom,
          to: toStepId,
          fromButton: connectingFromButton !== null ? connectingFromButton : undefined
        };
        console.log('Creating new connection:', newConnection);
        const newConnections = [...connections, newConnection];
        console.log('Setting connections to:', newConnections);
        setConnections(newConnections);
        
        // Update source step connections or button connections
        const sourceStep = flowSteps.find(s => s.id === connectingFrom);
        if (sourceStep) {
          if (connectingFromButton !== null) {
            // Update button connection
            const newButtons = [...(sourceStep.config.buttons || [])];
            if (newButtons[connectingFromButton]) {
              newButtons[connectingFromButton] = {
                ...newButtons[connectingFromButton],
                connected_to: toStepId
              };
              updateStep(connectingFrom, {
                config: { ...sourceStep.config, buttons: newButtons }
              });
            }
          } else {
            // Update step connection
            updateStep(connectingFrom, {
              connections: [...(sourceStep.connections || []), toStepId]
            });
          }
        }
        console.log('Connection created successfully:', newConnection);
      } else {
        console.log('Connection already exists');
      }
    }
    
    setIsConnecting(false);
    setConnectingFrom(null);
    setConnectingFromButton(null);
  };
  
  const removeConnection = (from: string, to: string, fromButton?: number) => {
    setConnections(connections.filter(conn => !(
      conn.from === from && 
      conn.to === to && 
      conn.fromButton === fromButton
    )));
    
    const sourceStep = flowSteps.find(s => s.id === from);
    if (sourceStep) {
      if (fromButton !== undefined) {
        // Remove button connection
        const newButtons = [...(sourceStep.config.buttons || [])];
        if (newButtons[fromButton]) {
          newButtons[fromButton] = {
            ...newButtons[fromButton],
            connected_to: undefined
          };
          updateStep(from, {
            config: { ...sourceStep.config, buttons: newButtons }
          });
        }
      } else {
        // Remove step connection
        updateStep(from, {
          connections: sourceStep.connections.filter(id => id !== to)
        });
      }
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
    
    // Separate buttons by type for WhatsApp API constraints
    const automationButtons = buttons.filter((b: any) => b.type === 'automation');
    const urlButtons = buttons.filter((b: any) => b.type === 'link');
    const phoneButtons = buttons.filter((b: any) => b.type === 'phone');
    
    // WhatsApp API constraint: Can't mix quick reply and CTA buttons
    const hasAutomationButtons = automationButtons.length > 0;
    const hasCTAButtons = urlButtons.length > 0 || phoneButtons.length > 0;
    const violatesConstraint = hasAutomationButtons && hasCTAButtons;
    
    console.log('🔍 Rendering WhatsApp preview:', { 
      message, buttons, attachments, 
      hasAutomationButtons, hasCTAButtons, violatesConstraint 
    });
    
    return (
      <div className="space-y-2">
        {/* Main Message */}
        <div className={`bg-white border rounded-lg p-3 max-w-xs ${violatesConstraint ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
          {/* Constraint Warning */}
          {violatesConstraint && (
            <div className="mb-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
              ⚠️ WhatsApp: Can't mix automation + URL buttons in one template. Will send as separate messages.
            </div>
          )}

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{getAttachmentIcon(attachments[0].type || 'pdf')}</span>
                <span className="font-medium">Media:</span>
                <span className="truncate">[{attachments[0].type?.toUpperCase() || 'FILE'}] {attachments[0].name || 'Document'}</span>
              </div>
              {attachments[0].url && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  {attachments[0].url}
                </div>
              )}
            </div>
          )}
          
          {/* Message Text */}
          <div className="text-sm text-gray-900 mb-3 leading-relaxed">
            {message}
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-gray-400 text-right mb-3">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {/* Automation Buttons (Quick Reply) */}
          {automationButtons.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-green-600 font-medium">Quick Reply Buttons:</div>
              {automationButtons.map((button: any, index: number) => (
                <div key={`auto-${index}`} className="relative group">
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Connect button input:', button.text);
                    }}
                    title="Connect input to this button"
                  />
                  
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Starting connection from automation button', index, 'of step', step.id);
                      startConnection(step.id, index);
                    }}
                    title="Connect output from this button"
                  />
                  
                  <div className="border border-green-300 rounded-lg p-2 text-center text-sm bg-green-50 text-green-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>⚡</span>
                      <span className="font-medium">{button.text || 'Automation'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Triggers workflow</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separate CTA Message (if mixed buttons) */}
        {violatesConstraint && (urlButtons.length > 0 || phoneButtons.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
            <div className="text-xs text-blue-600 font-medium mb-2">Call-to-Action Buttons (Separate Template):</div>
            <div className="space-y-2">
              {urlButtons.map((button: any, index: number) => (
                <div key={`url-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                  <div className="flex items-center justify-center gap-2">
                    <span>🔗</span>
                    <span className="font-medium">{button.text || 'Visit Link'}</span>
                  </div>
                  {button.url && (
                    <div className="text-xs text-gray-500 mt-1 truncate">{button.url}</div>
                  )}
                </div>
              ))}
              {phoneButtons.map((button: any, index: number) => (
                <div key={`phone-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                  <div className="flex items-center justify-center gap-2">
                    <span>📞</span>
                    <span className="font-medium">{button.text || 'Call'}</span>
                  </div>
                  {button.phone && (
                    <div className="text-xs text-gray-500 mt-1">{button.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single type buttons (no constraint violation) */}
        {!violatesConstraint && (urlButtons.length > 0 || phoneButtons.length > 0) && (
          <div className="space-y-2">
            {urlButtons.map((button: any, index: number) => (
              <div key={`url-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                <div className="flex items-center justify-center gap-2">
                  <span>🔗</span>
                  <span className="font-medium">{button.text || 'Visit Link'}</span>
                </div>
                {button.url && (
                  <div className="text-xs text-gray-500 mt-1 truncate">{button.url}</div>
                )}
              </div>
            ))}
            {phoneButtons.map((button: any, index: number) => (
              <div key={`phone-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                <div className="flex items-center justify-center gap-2">
                  <span>📞</span>
                  <span className="font-medium">{button.text || 'Call'}</span>
                </div>
                {button.phone && (
                  <div className="text-xs text-gray-500 mt-1">{button.phone}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
        <div className={`bg-white rounded-xl shadow-lg border-2 min-w-[200px] transition-all relative ${
          isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
        } ${
          connectingFrom && connectingFrom !== step.id 
            ? 'ring-4 ring-green-400 ring-opacity-50 border-green-300 shadow-green-200' 
            : ''
        } ${
          connectingFrom === step.id 
            ? 'ring-4 ring-yellow-400 ring-opacity-50 border-yellow-300' 
            : ''
        } ${
          isDraggedStep ? 'shadow-2xl' : ''
        }`}>
          
          {/* Left Connection Dot (Input) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              console.log('Left dot clicked!', {
                stepId: step.id,
                isConnecting,
                connectingFrom,
                connectingFromButton,
                canConnect: connectingFrom && connectingFrom !== step.id
              });
              // Use connectingFrom instead of isConnecting for more reliable check
              if (connectingFrom && connectingFrom !== step.id) {
                console.log('Attempting to complete connection to:', step.id);
                completeConnection(step.id);
              } else {
                console.log('Cannot connect - conditions not met');
              }
            }}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer z-20 transition-all ${
              connectingFrom && connectingFrom !== step.id
                ? 'bg-green-500 border-green-600 shadow-lg scale-125'
                : 'bg-gray-300 border-gray-400 hover:bg-blue-400 hover:border-blue-500'
            }`}
            title={connectingFrom ? "Click to complete connection" : "Connection input"}
          />
          
          {/* Right Connection Dot (Output) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              console.log('Right dot clicked!', {
                stepId: step.id,
                isConnecting,
                connectingFrom,
                connectingFromButton
              });
              if (!isConnecting) {
                console.log('Starting connection from step:', step.id);
                startConnection(step.id);
              } else if (connectingFrom === step.id && connectingFromButton === null) {
                // Cancel connection if clicking on same step (and not from a button)
                console.log('Cancelling connection');
                setIsConnecting(false);
                setConnectingFrom(null);
                setConnectingFromButton(null);
              }
            }}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer z-20 transition-all ${
              connectingFrom === step.id && connectingFromButton === null
                ? 'bg-yellow-500 border-yellow-600 shadow-lg scale-125'
                : 'bg-blue-500 border-blue-600 hover:bg-purple-500 hover:border-purple-600'
            }`}
            title={
              connectingFrom === step.id && connectingFromButton === null
                ? "Click to cancel connection" 
                : "Click to start connection"
            }
          />
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
            <div className={`text-xs ${step.type === 'message' ? '' : 'text-gray-600'}`}>
              {step.type === 'message' ? (
                <div className="text-center">
                  {renderStepPreview(step)}
                </div>
              ) : (
                renderStepPreview(step)
              )}
            </div>
            
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
  
  const renderConnections = () => {
    console.log('renderConnections called, connections:', connections);
    if (!canvasRef.current || connections.length === 0) {
      console.log('No connections to render');
      return null;
    }

    return (
      <svg
        className="absolute top-0 left-0 w-full h-full overflow-visible"
        style={{
          zIndex: 5,
          pointerEvents: 'none'
        }}
      >
        <defs>
          <marker
            id="arrowhead"
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
          
          <marker
            id="arrowhead-green"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#10b981"
            />
          </marker>
          
          <filter id="connection-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>
        
        {connections.map((connection, index) => {
          const fromStep = flowSteps.find(s => s.id === connection.from);
          const toStep = flowSteps.find(s => s.id === connection.to);
          
          if (!fromStep || !toStep) return null;
          
          // Calculate connection points accounting for zoom and position  
          const stepWidth = 200;
          const stepHeight = 120;
          
          // Account for canvas transforms
          const scaledStepWidth = stepWidth * canvasZoom;
          const scaledStepHeight = stepHeight * canvasZoom;
          
          const fromX = (fromStep.position.x * canvasZoom) + canvasPosition.x + scaledStepWidth; // Right edge 
          const fromY = (fromStep.position.y * canvasZoom) + canvasPosition.y + (scaledStepHeight / 2); // Middle height
          const toX = (toStep.position.x * canvasZoom) + canvasPosition.x; // Left edge  
          const toY = (toStep.position.y * canvasZoom) + canvasPosition.y + (scaledStepHeight / 2); // Middle height
          
          console.log('Connection coordinates:', { 
            fromX, fromY, toX, toY, 
            fromStep: fromStep.position, 
            toStep: toStep.position,
            canvasZoom,
            canvasPosition 
          });
          
          // Create curved path for better visual
          const controlPointOffset = Math.abs(toX - fromX) * 0.3;
          const controlPoint1X = fromX + Math.min(controlPointOffset, 100);
          const controlPoint1Y = fromY;
          const controlPoint2X = toX - Math.min(controlPointOffset, 100);
          const controlPoint2Y = toY;
          
          const pathD = `M ${fromX} ${fromY} 
                        C ${controlPoint1X} ${controlPoint1Y}, 
                          ${controlPoint2X} ${controlPoint2Y}, 
                          ${toX} ${toY}`;
          
          return (
            <g key={`connection-${index}`}>
              {/* Connection path */}
              <path
                d={pathD}
                stroke={connection.fromButton !== undefined ? "#10b981" : "#6366f1"}
                strokeWidth="3"
                fill="none"
                markerEnd={connection.fromButton !== undefined ? "url(#arrowhead-green)" : "url(#arrowhead)"}
                filter="url(#connection-shadow)"
                className="transition-all duration-200"
                strokeDasharray={connection.fromButton !== undefined ? "5,5" : "none"}
              />
              
              {/* Connection label if needed */}
              {connection.label && (
                <text
                  x={(fromX + toX) / 2}
                  y={(fromY + toY) / 2 - 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 font-medium pointer-events-none"
                  style={{ fontSize: '12px' }}
                >
                  {connection.label}
                </text>
              )}
              
              {/* Button connection indicator */}
              {connection.fromButton !== undefined && (
                <text
                  x={(fromX + toX) / 2}
                  y={(fromY + toY) / 2 - 15}
                  textAnchor="middle"
                  className="text-xs fill-green-600 font-medium pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  ⚡ Button
                </text>
              )}
              
              {/* Connection delete button (clickable area) */}
              <circle
                cx={(fromX + toX) / 2}
                cy={(fromY + toY) / 2}
                r="8"
                fill="rgba(239, 68, 68, 0.1)"
                stroke="#ef4444"
                strokeWidth="1"
                className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ pointerEvents: 'all' }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeConnection(connection.from, connection.to, connection.fromButton);
                }}
              />
              <text
                x={(fromX + toX) / 2}
                y={(fromY + toY) / 2 + 3}
                textAnchor="middle"
                className="text-xs fill-red-600 font-bold opacity-0 hover:opacity-100 transition-opacity"
                style={{ fontSize: '10px', pointerEvents: 'none' }}
              >
                ×
              </text>
            </g>
          );
        })}
      </svg>
    );
  };
  
  const renderStepConfigForm = (step: FlowStep) => {
    const updateConfig = (newConfig: any) => {
      console.log('Updating config for step:', step.id, 'with:', newConfig);
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
                <textarea
                  rows={3}
                  defaultValue={Array.isArray(step.config.keywords) ? step.config.keywords.join(', ') : ''}
                  onBlur={(e) => {
                    const value = e.target.value;
                    console.log('Keywords input changed on blur:', value);
                    
                    // Handle empty string
                    if (!value.trim()) {
                      updateConfig({ 
                        ...step.config, 
                        keywords: []
                      });
                      return;
                    }
                    
                    const keywords = value
                      .split(',')
                      .map((k: string) => k.trim())
                      .filter((k: string) => k.length > 0);
                    
                    console.log('Parsed keywords on blur:', keywords);
                    
                    updateConfig({ 
                      ...step.config, 
                      keywords: keywords
                    });
                  }}
                  onKeyDown={(e) => {
                    // Also update on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.currentTarget.value;
                      const keywords = value
                        .split(',')
                        .map((k: string) => k.trim())
                        .filter((k: string) => k.length > 0);
                      
                      updateConfig({ 
                        ...step.config, 
                        keywords: keywords
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="hello, start, help, support"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Enter keywords separated by commas. Example: hello, start, help
                  </p>
                  {Array.isArray(step.config.keywords) && step.config.keywords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Current keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {step.config.keywords.map((keyword: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Media Attachments (Images, Videos, Documents)
              </label>
              <div className="space-y-3">
                {step.config.attachments?.map((attachment: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getAttachmentIcon(attachment.type || 'pdf')}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={attachment.name || ''}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, name: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="File name (e.g., Product_Catalog.pdf)"
                          />
                          <select
                            value={attachment.type || 'image'}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, type: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="audio">Audio</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept={
                              attachment.type === 'image' ? 'image/*' :
                              attachment.type === 'video' ? 'video/*' :
                              attachment.type === 'audio' ? 'audio/*' : '*'
                            }
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Upload to Cloudinary placeholder
                                console.log('Uploading file:', file);
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('type', attachment.type);
                                
                                try {
                                  // TODO: Implement actual upload to backend
                                  const uploadUrl = `${API_BASE}/upload-media`;
                                  const response = await fetch(uploadUrl, {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  const result = await response.json();
                                  
                                  const newAttachments = [...(step.config.attachments || [])];
                                  newAttachments[index] = { 
                                    ...attachment, 
                                    url: result.url,
                                    cloudinary_id: result.public_id,
                                    file_size: result.bytes,
                                    name: attachment.name || file.name
                                  };
                                  updateConfig({ ...step.config, attachments: newAttachments });
                                } catch (error) {
                                  console.error('Upload failed:', error);
                                  alert('Upload failed. Please try again.');
                                }
                              }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                          
                          <input
                            type="url"
                            value={attachment.url || ''}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, url: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Or paste media URL"
                          />
                          
                          {attachment.url && (
                            <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                              ✅ <span>Media ready: {attachment.url}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newAttachments = step.config.attachments?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove media"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const newAttachments = [...(step.config.attachments || []), { 
                      name: '', 
                      type: 'image', 
                      url: '' 
                    }];
                    updateConfig({ ...step.config, attachments: newAttachments });
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
                >
                  <MdAdd className="w-4 h-4" />
                  Add Media Attachment
                </button>
              </div>
            </div>

            {/* Message Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text
              </label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => updateConfig({ ...step.config, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Hi {{name}}, Thank you for shopping with us. Would you like delivery updates?"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Hi {{name}}, Thank you for shopping with us.\nWould you like delivery updates?" 
                  })}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                >
                  📦 Delivery Template
                </button>
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Hi {{name}}, Welcome to {{business}}!\nHow can we help you today?" 
                  })}
                  className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                >
                  👋 Welcome Template
                </button>
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Thanks for your order #{{order_id}}!\nYour order is being processed." 
                  })}
                  className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100"
                >
                  🛍️ Order Template
                </button>
              </div>
            </div>
            
            {/* Interactive Buttons with WhatsApp Constraints */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    🔘 Interactive Buttons (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    WhatsApp constraint: Can't mix automation + URL buttons in one template
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newButtons = [
                        { text: 'Yes', type: 'automation', automation_id: '' },
                        { text: 'No', type: 'automation', automation_id: '' }
                      ];
                      updateConfig({ ...step.config, buttons: newButtons });
                    }}
                    className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                  >
                    ⚡ Yes/No
                  </button>
                  <button
                    onClick={() => {
                      const newButtons = [
                        { text: 'Visit Website', type: 'link', url: 'https://example.com' },
                        { text: 'Call Us', type: 'phone', phone: '+1234567890' }
                      ];
                      updateConfig({ ...step.config, buttons: newButtons });
                    }}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    🔗 CTA Buttons
                  </button>
                </div>
              </div>
              
              {/* Button Type Warning */}
              {(() => {
                const buttons = step.config.buttons || [];
                const automationButtons = buttons.filter((b: any) => b.type === 'automation');
                const ctaButtons = buttons.filter((b: any) => b.type === 'link' || b.type === 'phone');
                const violatesConstraint = automationButtons.length > 0 && ctaButtons.length > 0;
                
                return violatesConstraint && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <div>
                        <p className="text-sm text-orange-800 font-medium">Mixed Button Types Detected</p>
                        <p className="text-xs text-orange-700 mt-1">
                          WhatsApp will send automation buttons in one message, URL/phone buttons in a separate template message.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {step.config.buttons?.map((button: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    {/* Button Text & Type */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={button.text || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, text: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Button text"
                      />
                      <select
                        value={button.type || 'link'}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          const newType = e.target.value;
                          newButtons[index] = { 
                            text: button.text,
                            type: newType,
                            ...(newType === 'link' ? { url: '' } : 
                                newType === 'phone' ? { phone: '' } : 
                                { automation_id: '' })
                          };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="automation">⚡ Automation</option>
                        <option value="link">🔗 URL Link</option>
                        <option value="phone">📞 Phone Call</option>
                      </select>
                      <button
                        onClick={() => {
                          const newButtons = step.config.buttons?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete button"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Button Configuration */}
                    {button.type === 'link' && (
                      <input
                        type="url"
                        value={button.url || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, url: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="https://example.com"
                      />
                    )}
                    
                    {button.type === 'phone' && (
                      <input
                        type="tel"
                        value={button.phone || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, phone: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="+1234567890"
                      />
                    )}

                    {button.type === 'automation' && (
                      <div className="text-xs text-gray-500 bg-green-50 p-2 rounded flex items-center gap-2">
                        ⚡ <span>Connect to next step using the blue connection dot →</span>
                      </div>
                    )}

                    {/* Button Preview */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Preview:</div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs border ${
                        button.type === 'link' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        button.type === 'phone' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {button.type === 'link' ? '🔗' : button.type === 'phone' ? '📞' : '⚡'} 
                        {button.text || 'Button'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newButtons = [...(step.config.buttons || []), { 
                    text: '', 
                    type: 'automation', 
                    automation_id: ''
                  }];
                  updateConfig({ ...step.config, buttons: newButtons });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
              >
                <MdAdd className="w-4 h-4" />
                Add Interactive Button
              </button>
            </div>
          </div>
        );

      // Add other step type configurations here...
      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration for {step.type} step type coming soon...
          </div>
        );
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Find the trigger step to extract trigger configuration
      const triggerStep = flowSteps.find(step => step.type === 'trigger');
      
      const automationData = {
        name: formData.name || 'New Automation',
        description: formData.description || '',
        trigger_type: triggerStep?.config.type || 'keyword',
        trigger_config: triggerStep?.config || {},
        workflow: flowSteps,
        connections: connections,
        status: formData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving automation:', automationData);
      
      // Save to backend via apiService
      const result = await apiService.createAutomation(automationData);
      console.log('Automation saved successfully:', result);
      
      // Show success message and redirect
      alert('Automation saved successfully!');
      router.push('/automations');
      
    } catch (error) {
      console.error('Error saving automation:', error);
      alert(`Error saving automation: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/automations')}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <MdArrowBack className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dynamic Automation Builder</h1>
                <p className="text-gray-600 mt-1">Create custom workflows with unlimited steps and connections</p>
              </div>
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
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <MdSave className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Automation'}
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
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar - Step Library */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Add Steps</h3>
          <div className="space-y-2">
            {stepTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => addStep(template.type as FlowStepType)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors text-left"
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
                {connectingFrom && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <MdArrowForward className="w-4 h-4" />
                    <span>
                      Click on the left dot of another step to connect from 
                      {connectingFromButton !== null 
                        ? ` button "${flowSteps.find(s => s.id === connectingFrom)?.config.buttons?.[connectingFromButton]?.text || 'Unnamed'}" of "${flowSteps.find(s => s.id === connectingFrom)?.title}"`
                        : ` "${flowSteps.find(s => s.id === connectingFrom)?.title}"`
                      }
                    </span>
                    <button
                      onClick={() => {
                        setIsConnecting(false);
                        setConnectingFrom(null);
                        setConnectingFromButton(null);
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Configure Step</h3>
                  <button
                    onClick={() => setSelectedStepId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                    title="Close configuration panel"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>
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
  );
}
