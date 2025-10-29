/**
 * AutomationFlowBuilder - ManyChat-style visual flow builder
 * Main component for building automation workflows with drag-and-drop interface
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  Connection,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import './AutomationFlowBuilder.css';

import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import AutomationTriggerNode from './nodes/AutomationTriggerNode';
import MessageNode from './nodes/MessageNode';
import ConditionNode from './nodes/ConditionNode';
import CollectInputNode from './nodes/CollectInputNode';
import WebhookNode from './nodes/WebhookNode';
import AIResponseNode from './nodes/AIResponseNode';
import TagNode from './nodes/TagNode';
import DelayNode from './nodes/DelayNode';

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

// Custom node types
const nodeTypes = {
  trigger: AutomationTriggerNode,
  sendMessage: MessageNode,
  condition: ConditionNode,
  collectInput: CollectInputNode,
  webhook: WebhookNode,
  aiResponse: AIResponseNode,
  addTag: TagNode,
  removeTag: TagNode,
  delay: DelayNode,
};

// Default edge style
const defaultEdgeOptions = {
  style: { 
    strokeWidth: 3, 
    stroke: '#6366f1',
  },
  type: 'smoothstep',
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
    width: 25,
    height: 25,
  },
};

interface AutomationFlowBuilderProps {
  automationId?: string;
  onSave?: (automation: any) => void;
  onTest?: () => void;
  readOnly?: boolean;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

const AutomationFlowBuilderComponent: React.FC<AutomationFlowBuilderProps> = ({
  automationId,
  onSave,
  onTest,
  readOnly = false,
  initialNodes = [],
  initialEdges = []
}) => {
  // Ensure all initial nodes have valid positions
  const validInitialNodes = initialNodes.map(node => ({
    ...node,
    position: node.position || { x: 250, y: 50 }
  }));
  
  const [nodes, setNodes, onNodesChange] = useNodesState(validInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [automationName, setAutomationName] = useState('New Automation');
  const [automationDescription, setAutomationDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Define handlers before useEffect
  const handleNodeEdit = useCallback((node: Node) => {
    setSelectedNode(node);
    setIsEditorOpen(true);
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  // Load initial nodes with handlers
  useEffect(() => {
    if (validInitialNodes.length > 0 && nodes.length === 0) {
      // Add handlers to initial nodes
      setNodes(validInitialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete
        }
      })));
    }
  }, [validInitialNodes.length, nodes.length, setNodes, handleNodeEdit, handleNodeDelete]);

  // Debug: Log edges whenever they change
  useEffect(() => {
    debugLog('🔄 Edges updated:', edges.length, edges);
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      debugLog('🔗 Connection attempt:', {
        source: params.source,
        sourceHandle: params.sourceHandle,
        target: params.target,
        targetHandle: params.targetHandle
      });
      
      // Validate source and target exist
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) {
        console.error('❌ Source or target node not found', { 
          sourceExists: !!sourceNode, 
          targetExists: !!targetNode,
          allNodes: nodes.map(n => ({ id: n.id, type: n.type }))
        });
        return;
      }
      
      debugLog('✅ Nodes found:', {
        source: sourceNode.type,
        target: targetNode.type
      });
      
      // Ensure handle IDs are included
      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
        type: 'smoothstep',
        animated: true,
        style: { 
          strokeWidth: 4, 
          stroke: '#6366f1' 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
          width: 30,
          height: 30
        },
        data: { conditionType: 'always' }
      } as Edge;
      
      debugLog('🎨 Creating edge:', newEdge);
      setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        debugLog('📊 All edges after add:', newEdges);
        return newEdges;
      });
      debugLog('✅ Edge added:', newEdge.id);
    },
    [nodes, setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeId = event.dataTransfer.getData('application/reactflow-nodeid');
      
      // Safety checks: ensure ReactFlow is initialized
      if (!type || !reactFlowWrapper.current || !reactFlowInstance) {
        console.warn('⚠️ Cannot drop node: ReactFlow not ready');
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      const newNodeId = `${type}-${Date.now()}`;
      
      // Get default node data
      let nodeData = getDefaultNodeData(type);
      
      const newNode: Node = {
        id: newNodeId,
        type: type as any,
        position,
        data: {
          label: getNodeLabel(type),
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          ...nodeData
        },
      };

      debugLog('🆕 Adding new node:', newNodeId, 'type:', type, 'nodeId:', nodeId);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleNodeEdit, handleNodeDelete]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setIsEditorOpen(false);
    setSelectedNode(null);
  }, [setNodes]);

  const validateAutomation = (): string[] => {
    const validationErrors: string[] = [];

    // Check for trigger node (warning only, not blocking)
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0 && nodes.length > 0) {
      validationErrors.push('Warning: Automation has no trigger. Add a trigger to activate it.');
    }

    // Check for orphaned nodes (nodes without incoming connections except trigger)
    const connectedNodeIds = new Set(edges.map(edge => edge.target));
    const orphanedNodes = nodes.filter(node => 
      node.type !== 'trigger' && !connectedNodeIds.has(node.id)
    );
    if (orphanedNodes.length > 0) {
      validationErrors.push(`${orphanedNodes.length} nodes are not connected to the flow`);
    }

    // Check for incomplete node configurations
    nodes.forEach(node => {
      switch (node.type) {
        case 'sendMessage':
          if (!node.data.messageText || node.data.messageText.trim() === '') {
            validationErrors.push(`Message node "${node.data.label}" is missing message text`);
          }
          break;
        case 'condition':
          if (!node.data.conditionField || !node.data.conditionOperator) {
            validationErrors.push(`Condition node "${node.data.label}" is incomplete`);
          }
          break;
        case 'collectInput':
          if (!node.data.inputType || !node.data.variableName) {
            validationErrors.push(`Input node "${node.data.label}" is incomplete`);
          }
          break;
        case 'webhook':
          if (!node.data.webhookUrl) {
            validationErrors.push(`Webhook node "${node.data.label}" is missing URL`);
          }
          break;
      }
    });

    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateAutomation();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      const automationData = {
        name: automationName,
        description: automationDescription,
        is_active: isActive,
        steps: nodes.map(node => ({
          id: node.id,
          type: node.type,
          config: node.data,
          position: node.position
        })),
        connections: edges.map(edge => ({
          from_step: edge.source,
          to_step: edge.target,
          condition_type: edge.data?.conditionType || 'always'
        })),
        trigger_config: {
          trigger_type: nodes.find(n => n.type === 'trigger')?.data.triggerType || 'keyword',
          keywords: nodes.find(n => n.type === 'trigger')?.data.keywords || [],
          integration_id: nodes.find(n => n.type === 'trigger')?.data.integrationId || null,
          integration_name: nodes.find(n => n.type === 'trigger')?.data.integrationName || null,
          integration_event: nodes.find(n => n.type === 'trigger')?.data.integrationEvent || null,
          integration_event_label: nodes.find(n => n.type === 'trigger')?.data.integrationEventLabel || null,
          trigger_conditions: {}
        }
      };

      if (onSave) {
        await onSave(automationData);
      }
    } catch (error) {
      setErrors(['Failed to save automation. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    const validationErrors = validateAutomation();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (onTest) {
      onTest();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Node Palette */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Flow Builder</h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag nodes to build your automation
          </p>
        </div>
        
        {/* Automation Settings */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automation Name
              </label>
              <input
                type="text"
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter automation name"
                disabled={readOnly}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={automationDescription}
                onChange={(e) => setAutomationDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Describe what this automation does"
                disabled={readOnly}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={readOnly}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Validation Errors
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readOnly && (
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Automation'}
              </button>
              
              <button
                onClick={handleTest}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Test Automation
              </button>
            </div>
          </div>
        )}

        <NodePalette />
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {nodes && edges ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ 
              strokeWidth: 3, 
              stroke: '#6366f1',
              strokeDasharray: '5,5'
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-left"
            minZoom={0.1}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[15, 15]}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1}
              color="#e5e7eb"
            />
            <Controls />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading flow builder...</p>
          </div>
        )}
      </div>

      {/* Node Editor Panel */}
      {isEditorOpen && selectedNode && (
        <NodeEditor
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

// Helper functions
function getNodeLabel(type: string): string {
  const labels: Record<string, string> = {
    trigger: 'Trigger',
    sendMessage: 'Send Message',
    condition: 'Condition',
    collectInput: 'Collect Input',
    webhook: 'Webhook',
    aiResponse: 'AI Response',
    addTag: 'Add Tag',
    removeTag: 'Remove Tag',
    delay: 'Delay',
  };
  return labels[type] || 'Unknown';
}

function getDefaultNodeData(type: string): any {
  const defaults: Record<string, any> = {
    trigger: {
      triggerType: 'keyword',
      keywords: [],
    },
    sendMessage: {
      messageText: '',
      quickReplies: [],
    },
    condition: {
      conditionField: '',
      conditionOperator: 'equals',
      conditionValue: '',
    },
    collectInput: {
      inputType: 'text',
      variableName: '',
      validationRules: {},
    },
    webhook: {
      webhookUrl: '',
      webhookMethod: 'POST',
      webhookData: {},
    },
    aiResponse: {
      aiPrompt: '',
      aiContext: '',
      fallbackMessage: '',
    },
    addTag: {
      tags: [],
    },
    removeTag: {
      tags: [],
    },
    delay: {
      delayType: 'fixed',
      delayValue: 1,
      delayUnit: 'minutes',
    },
  };
  return defaults[type] || {};
}

// Inner component that uses React Flow hooks
const AutomationFlowBuilderInner: React.FC<AutomationFlowBuilderProps> = (props) => {
  return <AutomationFlowBuilderComponent {...props} />;
};

// Wrapper component with ReactFlowProvider  
const AutomationFlowBuilder: React.FC<AutomationFlowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <AutomationFlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
};

export default AutomationFlowBuilder;