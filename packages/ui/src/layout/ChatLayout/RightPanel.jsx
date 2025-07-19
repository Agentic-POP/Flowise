import { useEffect, useRef, useState, useContext } from 'react'
import ReactFlow, { Controls, MiniMap, Background, useNodesState, useEdgesState, addEdge } from 'reactflow'
import 'reactflow/dist/style.css'
import { Box, Typography, IconButton, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

// icons
import { IconX, IconMaximize, IconMinimize, IconRefresh, IconWand } from '@tabler/icons-react'

// project imports
import { useGlobalChat } from '@/store/context/GlobalChatContext'
import { flowContext } from '@/store/context/ReactFlowContext'
import CanvasNode from '@/views/agentflowsv2/AgentFlowNode'
import IterationNode from '@/views/agentflowsv2/IterationNode'
import AgentFlowEdge from '@/views/agentflowsv2/AgentFlowEdge'
import StickyNote from '@/views/agentflowsv2/StickyNote'
import { isValidConnectionAgentflowV2 } from '@/utils/genericHelper'

// ==============================|| RIGHT PANEL ||============================== //

const nodeTypes = {
    agentFlow: CanvasNode,
    stickyNote: StickyNote,
    iteration: IterationNode
}
const edgeTypes = { agentFlow: AgentFlowEdge }

const RightPanel = ({ onToggle, isOpen }) => {
    const theme = useTheme()
    const { currentProject, canvasState, registerCanvas, unregisterCanvas, updateCanvas } = useGlobalChat()

    const { reactFlowInstance, setReactFlowInstance } = useContext(flowContext)

    // ReactFlow state
    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()

    // Local state
    const [isFullscreen, setIsFullscreen] = useState(false)
    const reactFlowWrapper = useRef(null)

    // Register canvas with global context
    useEffect(() => {
        if (reactFlowInstance && reactFlowWrapper.current) {
            registerCanvas(reactFlowWrapper.current, reactFlowInstance)
        }

        return () => {
            unregisterCanvas()
        }
    }, [reactFlowInstance, registerCanvas, unregisterCanvas])

    // Sync canvas state with global state
    useEffect(() => {
        if (canvasState.nodes && canvasState.edges) {
            setNodes(canvasState.nodes)
            setEdges(canvasState.edges)
        }
    }, [canvasState.nodes, canvasState.edges, setNodes, setEdges])

    // Handle connections
    const onConnect = (params) => {
        if (!isValidConnectionAgentflowV2(params, reactFlowInstance)) {
            return
        }

        const newEdges = addEdge(params, edges)
        setEdges(newEdges)

        // Update global state
        updateCanvas(nodes, newEdges, 'canvas_connection')
    }

    // Handle node changes
    const onNodesChangeHandler = (changes) => {
        onNodesChange(changes)

        // Update global state after changes
        const updatedNodes = changes.reduce((acc, change) => {
            if (change.type === 'position' && change.dragging === false) {
                // Node drag finished
                const updatedNode = nodes.find((n) => n.id === change.id)
                if (updatedNode) {
                    updatedNode.position = change.position
                }
            }
            return acc
        }, nodes)

        updateCanvas(updatedNodes, edges, 'canvas_node_change')
    }

    // Handle edge changes
    const onEdgesChangeHandler = (changes) => {
        onEdgesChange(changes)

        // Update global state after changes
        updateCanvas(nodes, edges, 'canvas_edge_change')
    }

    // Handle fullscreen toggle
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Handle fit view
    const fitView = () => {
        if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.1 })
        }
    }

    // Get canvas stats
    const getCanvasStats = () => {
        return {
            nodes: nodes.length,
            edges: edges.length,
            nodeTypes: [...new Set(nodes.map((n) => n.data?.name))].length
        }
    }

    const stats = getCanvasStats()

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconWand size={20} color={theme.palette.primary.main} />
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        Canvas
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Canvas Stats */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip label={`${stats.nodes} nodes`} size='small' variant='outlined' />
                        <Chip label={`${stats.edges} edges`} size='small' variant='outlined' />
                    </Box>

                    {/* Canvas Controls */}
                    <IconButton onClick={fitView} size='small' title='Fit View'>
                        <IconRefresh size={16} />
                    </IconButton>

                    <IconButton onClick={toggleFullscreen} size='small' title='Toggle Fullscreen'>
                        {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                    </IconButton>

                    <IconButton onClick={onToggle} size='small'>
                        <IconX size={16} />
                    </IconButton>
                </Box>
            </Box>

            {/* Canvas */}
            <Box
                ref={reactFlowWrapper}
                sx={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: theme.palette.grey[50]
                }}
            >
                {currentProject ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChangeHandler}
                        onEdgesChange={onEdgesChangeHandler}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        attributionPosition='bottom-left'
                        style={{
                            backgroundColor: theme.palette.grey[50]
                        }}
                    >
                        <Background color={theme.palette.grey[300]} gap={20} size={1} />
                        <Controls position='top-right' showZoom={true} showFitView={false} showInteractive={false} />
                        <MiniMap
                            position='bottom-right'
                            nodeColor={theme.palette.primary.main}
                            maskColor={theme.palette.background.paper + '80'}
                        />
                    </ReactFlow>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'center',
                            p: 3
                        }}
                    >
                        <IconWand size={48} color={theme.palette.grey[400]} />
                        <Typography variant='h6' sx={{ mt: 2, mb: 1, color: theme.palette.grey[600] }}>
                            No Project Selected
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Select a project from the left panel to view its canvas
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Footer - Project Info */}
            {currentProject && (
                <Box
                    sx={{
                        p: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper
                    }}
                >
                    <Typography variant='caption' color='text.secondary' display='block'>
                        Project: {currentProject.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                        Last modified: {new Date(currentProject.updatedAt || currentProject.createdAt).toLocaleString()}
                    </Typography>
                </Box>
            )}
        </Box>
    )
}

RightPanel.propTypes = {
    onToggle: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired
}

export default RightPanel
