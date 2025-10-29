import React, { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ArchitectureDiagramData, ArchitectureNode, ArchitectureEdge } from '../types/index';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface ArchitectureDiagramProps {
  repositoryId: number;
  fileId: number;
}

// Custom node components
const FunctionNode: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-300">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
      <div className="text-xs font-bold text-blue-800">{data.label as string}</div>
    </div>
    {data.description ? (
      <div className="text-xs text-blue-600 mt-1">{String(data.description)}</div>
    ) : null}
  </div>
);

const ClassNode: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 border-purple-300">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
      <div className="text-xs font-bold text-purple-800">{data.label as string}</div>
    </div>
    {data.description ? (
      <div className="text-xs text-purple-600 mt-1">{String(data.description)}</div>
    ) : null}
  </div>
);

const ModuleNode: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-300">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
      <div className="text-xs font-bold text-green-800">{data.label as string}</div>
    </div>
    {data.description ? (
      <div className="text-xs text-green-600 mt-1">{String(data.description)}</div>
    ) : null}
  </div>
);

const ApiNode: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 border-orange-300">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
      <div className="text-xs font-bold text-orange-800">{data.label as string}</div>
    </div>
    {data.description ? (
      <div className="text-xs text-orange-600 mt-1">{String(data.description)}</div>
    ) : null}
  </div>
);

const nodeTypes: NodeTypes = {
  function: FunctionNode,
  class: ClassNode,
  module: ModuleNode,
  api: ApiNode,
};

const ArchitectureDiagramInner: React.FC<ArchitectureDiagramProps> = ({ repositoryId, fileId }) => {
  const [diagram, setDiagram] = useState<ArchitectureDiagramData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const generateDiagramMutation = useMutation({
    mutationFn: () => apiClient.generateArchitectureDiagram(repositoryId, fileId),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (response) => {
      setDiagram(response.architecture_diagram);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating architecture diagram:', error);
      setIsGenerating(false);
    }
  });

  // Convert API data to ReactFlow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!diagram) return { nodes: [], edges: [] };

    const nodes: Node[] = diagram.nodes.map((node: ArchitectureNode) => ({
      id: node.id,
      type: node.type,
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        label: node.label,
        description: node.description,
        metadata: node.metadata,
      },
    }));

    const edges: Edge[] = diagram.edges.map((edge: ArchitectureEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edge.type === 'calls' ? 'default' : 
            edge.type === 'imports' ? 'straight' : 'step',
      style: edge.type === 'imports' ? { strokeDasharray: '5,5' } : {},
      labelStyle: { fontSize: 10 },
    }));

    return { nodes, edges };
  }, [diagram]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when diagram changes
  React.useEffect(() => {
    const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({ 
        rankdir: diagram?.layout === 'horizontal' ? 'LR' : 
                diagram?.layout === 'vertical' ? 'TB' : 'LR',
        ranksep: 100,
        nodesep: 50,
      });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 80 });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 75,
            y: nodeWithPosition.y - 40,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    };

    setNodes(initialNodes);
    setEdges(initialEdges);
    
    // Apply layout if we have nodes
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layoutedNodes);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, diagram?.layout]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const exportDiagram = (format: 'png' | 'svg') => {
    // This would require additional libraries like html2canvas or react-flow-to-svg
    console.log(`Exporting diagram as ${format}`);
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Architecture Diagram</h2>
          <p className="text-gray-600 mt-1">Interactive code structure visualization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {diagram && (
            <>
              <button
                onClick={() => exportDiagram('png')}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Export PNG</span>
              </button>
              
              <button
                onClick={() => exportDiagram('svg')}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <span>Export SVG</span>
              </button>
            </>
          )}
          
          {!diagram && (
            <button
              onClick={() => generateDiagramMutation.mutate()}
              disabled={isGenerating}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Generate Diagram</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing code structure...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {generateDiagramMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Generation Failed</h3>
              <p className="text-red-700 mt-1">Unable to generate architecture diagram. Please try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Diagram */}
      {diagram && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Functions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Classes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Modules</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">APIs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-0.5 bg-gray-500"></div>
                <span className="text-sm text-gray-700">Calls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-0.5 bg-gray-500 border-dashed border border-gray-500"></div>
                <span className="text-sm text-gray-700">Imports</span>
              </div>
            </div>
          </div>

          {/* ReactFlow Diagram */}
          <div className="h-[600px] border border-gray-200 rounded-xl bg-gray-50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'function') return '#3B82F6';
                  if (n.type === 'class') return '#8B5CF6';
                  if (n.type === 'module') return '#10B981';
                  if (n.type === 'api') return '#F59E0B';
                  return '#6B7280';
                }}
                nodeColor={(n) => {
                  if (n.type === 'function') return '#DBEAFE';
                  if (n.type === 'class') return '#EDE9FE';
                  if (n.type === 'module') return '#D1FAE5';
                  if (n.type === 'api') return '#FEF3C7';
                  return '#F3F4F6';
                }}
                nodeBorderRadius={8}
              />
            </ReactFlow>
          </div>

          {/* Node Details */}
          {selectedNode && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 capitalize text-gray-900">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Label:</span>
                  <span className="ml-2 text-gray-900">{selectedNode.data.label as string}</span>
                </div>
                {selectedNode.data.description ? (
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <span className="ml-2 text-gray-900">{String(selectedNode.data.description)}</span>
                  </div>
                ) : null}
                {selectedNode.data.metadata && Object.keys(selectedNode.data.metadata as Record<string, unknown>).length > 0 ? (
                  <div>
                    <span className="font-medium text-gray-700">Metadata:</span>
                    <div className="ml-2 text-sm text-gray-600">
                      {Object.entries(selectedNode.data.metadata as Record<string, unknown>).map(([key, value]) => (
                        <div key={key}>
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <button
              onClick={() => generateDiagramMutation.mutate()}
              disabled={isGenerating}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate Diagram</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = (props) => (
  <ReactFlowProvider>
    <ArchitectureDiagramInner {...props} />
  </ReactFlowProvider>
);

export default ArchitectureDiagram;
