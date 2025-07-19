import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

// API
import chatflowsApi from '@/api/chatflows'

// Utils
import { initNode, getUniqueNodeId, getUniqueNodeLabel } from '@/utils/genericHelper'

// ==============================|| GLOBAL CHAT CONTEXT ||============================== //

const GlobalChatContext = createContext()

export const useGlobalChat = () => {
    const context = useContext(GlobalChatContext)
    if (!context) {
        throw new Error('useGlobalChat must be used within a GlobalChatProvider')
    }
    return context
}

export const GlobalChatProvider = ({ children }) => {
    const dispatch = useDispatch()
    const canvas = useSelector((state) => state.canvas)

    // Global state
    const [currentProject, setCurrentProject] = useState(null)
    const [canvasState, setCanvasState] = useState({
        nodes: [],
        edges: [],
        chatflow: null
    })
    const [chatHistory, setChatHistory] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedModel, setSelectedModel] = useState(null)

    // Refs for real-time updates
    const canvasRef = useRef(null)
    const reactFlowInstanceRef = useRef(null)

    // Project management
    const loadProject = useCallback(async (projectId) => {
        try {
            const response = await chatflowsApi.getSpecificChatflow(projectId)
            const chatflow = response.data
            const flowData = chatflow.flowData ? JSON.parse(chatflow.flowData) : { nodes: [], edges: [] }

            setCurrentProject(chatflow)
            setCanvasState({
                nodes: flowData.nodes || [],
                edges: flowData.edges || [],
                chatflow
            })

            // Update canvas if available
            if (canvasRef.current && reactFlowInstanceRef.current) {
                reactFlowInstanceRef.current.setNodes(flowData.nodes || [])
                reactFlowInstanceRef.current.setEdges(flowData.edges || [])
            }

            return chatflow
        } catch (error) {
            console.error('Error loading project:', error)
            throw error
        }
    }, [])

    const createNewProject = useCallback(async (name, description = '') => {
        try {
            const response = await chatflowsApi.createNewChatflow({
                name,
                description,
                flowData: JSON.stringify({ nodes: [], edges: [] }),
                type: 'AGENTFLOWV2'
            })

            const newProject = response.data
            setCurrentProject(newProject)
            setCanvasState({
                nodes: [],
                edges: [],
                chatflow: newProject
            })

            return newProject
        } catch (error) {
            console.error('Error creating project:', error)
            throw error
        }
    }, [])

    // Canvas operations
    const updateCanvas = useCallback(
        (nodes, edges, source = 'chat') => {
            setCanvasState((prev) => ({
                ...prev,
                nodes: nodes || prev.nodes,
                edges: edges || prev.edges
            }))

            // Update canvas if available
            if (canvasRef.current && reactFlowInstanceRef.current) {
                if (nodes) reactFlowInstanceRef.current.setNodes(nodes)
                if (edges) reactFlowInstanceRef.current.setEdges(edges)
            }

            // Add to chat history
            setChatHistory((prev) => [
                ...prev,
                {
                    type: 'canvas_update',
                    source,
                    timestamp: new Date().toISOString(),
                    nodes: nodes || canvasState.nodes,
                    edges: edges || canvasState.edges
                }
            ])
        },
        [canvasState.nodes, canvasState.edges]
    )

    const addNode = useCallback(
        (nodeData, position) => {
            const newNode = {
                id: getUniqueNodeId(nodeData.name),
                type: 'agentFlow',
                position: position || { x: 100, y: 100 },
                data: {
                    ...initNode(nodeData, getUniqueNodeId(nodeData.name)),
                    label: getUniqueNodeLabel(nodeData.name)
                }
            }

            const newNodes = [...canvasState.nodes, newNode]
            updateCanvas(newNodes, canvasState.edges, 'chat_add_node')

            return newNode
        },
        [canvasState.nodes, canvasState.edges, updateCanvas]
    )

    const removeNode = useCallback(
        (nodeId) => {
            const newNodes = canvasState.nodes.filter((node) => node.id !== nodeId)
            const newEdges = canvasState.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
            updateCanvas(newNodes, newEdges, 'chat_remove_node')
        },
        [canvasState.nodes, canvasState.edges, updateCanvas]
    )

    const modifyNode = useCallback(
        (nodeId, modifications) => {
            const newNodes = canvasState.nodes.map((node) =>
                node.id === nodeId ? { ...node, data: { ...node.data, ...modifications } } : node
            )
            updateCanvas(newNodes, canvasState.edges, 'chat_modify_node')
        },
        [canvasState.nodes, canvasState.edges, updateCanvas]
    )

    // Chat operations
    const sendMessage = useCallback(
        async (message, context = {}) => {
            if (!selectedModel) {
                throw new Error('No model selected')
            }

            setIsGenerating(true)

            try {
                // Add user message to history
                const userMessage = {
                    type: 'user_message',
                    content: message,
                    timestamp: new Date().toISOString(),
                    context
                }

                setChatHistory((prev) => [...prev, userMessage])

                // Prepare context for AI
                const fullContext = {
                    currentProject: currentProject?.name || 'No project',
                    canvasState: {
                        nodeCount: canvasState.nodes.length,
                        edgeCount: canvasState.edges.length,
                        nodeTypes: [...new Set(canvasState.nodes.map((n) => n.data?.name))]
                    },
                    chatHistory: chatHistory.slice(-10), // Last 10 messages
                    ...context
                }

                // Call AI generation
                const response = await chatflowsApi.generateAgentflow({
                    question: message,
                    selectedChatModel: selectedModel,
                    context: fullContext
                })

                // Process AI response
                if (response.data && response.data.nodes && response.data.edges) {
                    updateCanvas(response.data.nodes, response.data.edges, 'ai_generation')
                }

                // Add AI response to history
                const aiMessage = {
                    type: 'ai_response',
                    content: response.data?.explanation || 'Generated new flow',
                    timestamp: new Date().toISOString(),
                    changes: {
                        nodes: response.data?.nodes || [],
                        edges: response.data?.edges || []
                    }
                }

                setChatHistory((prev) => [...prev, aiMessage])

                return aiMessage
            } catch (error) {
                console.error('Error sending message:', error)
                throw error
            } finally {
                setIsGenerating(false)
            }
        },
        [selectedModel, currentProject, canvasState, chatHistory, updateCanvas]
    )

    // Canvas registration
    const registerCanvas = useCallback((canvasInstance, reactFlowInstance) => {
        canvasRef.current = canvasInstance
        reactFlowInstanceRef.current = reactFlowInstance
    }, [])

    const unregisterCanvas = useCallback(() => {
        canvasRef.current = null
        reactFlowInstanceRef.current = null
    }, [])

    // Save project
    const saveProject = useCallback(async () => {
        if (!currentProject) return

        try {
            const flowData = {
                nodes: canvasState.nodes,
                edges: canvasState.edges
            }

            await chatflowsApi.updateChatflow(currentProject.id, {
                name: currentProject.name,
                flowData: JSON.stringify(flowData)
            })

            // Update chat history
            setChatHistory((prev) => [
                ...prev,
                {
                    type: 'project_saved',
                    timestamp: new Date().toISOString(),
                    projectName: currentProject.name
                }
            ])
        } catch (error) {
            console.error('Error saving project:', error)
            throw error
        }
    }, [currentProject, canvasState.nodes, canvasState.edges])

    // Context value
    const contextValue = {
        // State
        currentProject,
        canvasState,
        chatHistory,
        isGenerating,
        selectedModel,

        // Project management
        loadProject,
        createNewProject,
        saveProject,

        // Canvas operations
        updateCanvas,
        addNode,
        removeNode,
        modifyNode,
        registerCanvas,
        unregisterCanvas,

        // Chat operations
        sendMessage,

        // Model management
        setSelectedModel
    }

    return <GlobalChatContext.Provider value={contextValue}>{children}</GlobalChatContext.Provider>
}

GlobalChatProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default GlobalChatContext
