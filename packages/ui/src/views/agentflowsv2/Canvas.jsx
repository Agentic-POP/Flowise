import { useEffect, useRef, useState, useCallback, useContext } from 'react'
import ReactFlow, { addEdge, Controls, MiniMap, Background, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import './index.css'
import { useReward } from 'react-rewards'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    REMOVE_DIRTY,
    SET_DIRTY,
    SET_CHATFLOW,
    enqueueSnackbar as enqueueSnackbarAction,
    closeSnackbar as closeSnackbarAction
} from '@/store/actions'
import { omit, cloneDeep } from 'lodash'

// material-ui
import { Toolbar, Box, AppBar, Button, Fab } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import CanvasNode from './AgentFlowNode'
import IterationNode from './IterationNode'
import AgentFlowEdge from './AgentFlowEdge'
import ConnectionLine from './ConnectionLine'
import StickyNote from './StickyNote'
import CanvasHeader from '@/views/canvas/CanvasHeader'
import AddNodes from '@/views/canvas/AddNodes'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import EditNodeDialog from '@/views/agentflowsv2/EditNodeDialog'
import ChatPopUp from '@/views/chatmessage/ChatPopUp'
import ValidationPopUp from '@/views/chatmessage/ValidationPopUp'
import { flowContext } from '@/store/context/ReactFlowContext'
import EnhancedHistoryModal from '@/ui-component/dialog/EnhancedHistoryModal'

// API
import nodesApi from '@/api/nodes'
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'
import { useEnhancedHistory } from '@/hooks/useEnhancedHistory'

// icons
import { IconX, IconRefreshAlert, IconMagnetFilled, IconMagnetOff, IconWand } from '@tabler/icons-react'

// utils
import {
    getUniqueNodeLabel,
    getUniqueNodeId,
    initNode,
    updateOutdatedNodeData,
    updateOutdatedNodeEdge,
    isValidConnectionAgentflowV2
} from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'
import { usePrompt } from '@/utils/usePrompt'

// const
import { FLOWISE_CREDENTIAL_ID, AGENTFLOW_ICONS } from '@/store/constant'
import PropTypes from 'prop-types'
import AgentflowGeneratorPanel from './AgentflowGeneratorPanel'

const nodeTypes = { agentFlow: CanvasNode, stickyNote: StickyNote, iteration: IterationNode }
const edgeTypes = { agentFlow: AgentFlowEdge }

// ==============================|| CANVAS ||============================== //

// Accept chatflowId as a prop (for chat tab/canvas integration)
const AgentflowCanvas = ({ chatflowId: propChatflowId }) => {
    const theme = useTheme()
    const navigate = useNavigate()
    const customization = useSelector((state) => state.customization)

    const { state } = useLocation()
    const templateFlowData = state ? state.templateFlowData : ''

    // Use prop if provided, otherwise fallback to URL
    const URLpath = document.location.pathname.toString().split('/')
    const urlChatflowId =
        URLpath[URLpath.length - 1] === 'canvas' || URLpath[URLpath.length - 1] === 'agentcanvas' ? '' : URLpath[URLpath.length - 1]
    const chatflowId = propChatflowId || urlChatflowId
    const canvasTitle = URLpath.includes('agentcanvas') ? 'Agent' : 'Chatflow'

    const { confirm } = useConfirm()

    const dispatch = useDispatch()
    const canvas = useSelector((state) => state.canvas)
    const [canvasDataStore, setCanvasDataStore] = useState(canvas)
    const [chatflow, setChatflow] = useState(null)
    const flowContextValue = useContext(flowContext)
    const { reactFlowInstance, setReactFlowInstance } = flowContextValue

    // Enhanced history management
    const { history, historyIndex, canUndo, canRedo, pushHistory, undo, redo, clearHistory, getCurrentState, shouldCreateHistoryEntry } =
        useEnhancedHistory()

    // Create enhanced context value with history callbacks (will be defined after handlers)
    const [enhancedFlowContextValue, setEnhancedFlowContextValue] = useState(flowContextValue)

    // ==============================|| Snackbar ||============================== //

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // ==============================|| ReactFlow ||============================== //

    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()

    const [selectedNode, setSelectedNode] = useState(null)
    const [isSyncNodesButtonEnabled, setIsSyncNodesButtonEnabled] = useState(false)
    const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false)
    const [editNodeDialogProps, setEditNodeDialogProps] = useState({})
    const [isSnappingEnabled, setIsSnappingEnabled] = useState(false)

    const reactFlowWrapper = useRef(null)

    // ==============================|| Utility Functions ||============================== //

    const setDirty = () => {
        dispatch({ type: SET_DIRTY })
    }

    // ==============================|| Chatflow API ||============================== //

    const getNodesApi = useApi(nodesApi.getAllNodes)
    const createNewChatflowApi = useApi(chatflowsApi.createNewChatflow)
    const updateChatflowApi = useApi(chatflowsApi.updateChatflow)
    const getSpecificChatflowApi = useApi(chatflowsApi.getSpecificChatflow)

    // ==============================|| Events & Actions ||============================== //

    const onConnect = (params) => {
        if (!isValidConnectionAgentflowV2(params, reactFlowInstance)) {
            return
        }

        const nodeName = params.sourceHandle.split('_')[0]
        const targetNodeName = params.targetHandle.split('_')[0]

        const targetColor = AGENTFLOW_ICONS.find((icon) => icon.name === targetNodeName)?.color ?? theme.palette.primary.main
        const sourceColor = AGENTFLOW_ICONS.find((icon) => icon.name === nodeName)?.color ?? theme.palette.primary.main

        let edgeLabel = undefined
        if (nodeName === 'conditionAgentflow' || nodeName === 'conditionAgentAgentflow') {
            const _edgeLabel = params.sourceHandle.split('-').pop()
            edgeLabel = (isNaN(_edgeLabel) ? 0 : _edgeLabel).toString()
        }

        if (nodeName === 'humanInputAgentflow') {
            edgeLabel = params.sourceHandle.split('-').pop()
            edgeLabel = edgeLabel === '0' ? 'proceed' : 'reject'
        }

        // Check if both source and target nodes are within the same iteration node
        const sourceNode = reactFlowInstance.getNodes().find((node) => node.id === params.source)
        const targetNode = reactFlowInstance.getNodes().find((node) => node.id === params.target)
        const isWithinIterationNode = sourceNode?.parentNode && targetNode?.parentNode && sourceNode.parentNode === targetNode.parentNode

        const newEdge = {
            ...params,
            data: {
                ...params.data,
                sourceColor,
                targetColor,
                edgeLabel,
                isHumanInput: nodeName === 'humanInputAgentflow'
            },
            ...(isWithinIterationNode && { zIndex: 9999 }),
            type: 'agentFlow',
            id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`
        }

        const oldState = { nodes, edges }
        const newEdges = addEdge(newEdge, edges)
        setEdges(newEdges)

        // Add to history with enhanced tracking
        pushHistory('connect_edges', nodes, newEdges, oldState, {
            description: `Connected ${nodeName} to ${targetNodeName}`,
            source: 'manual',
            selectedNodes: [params.source, params.target]
        })
    }

    const handleLoadFlow = (file) => {
        try {
            const flowData = JSON.parse(file)
            const nodes = flowData.nodes || []
            const oldState = { nodes, edges }

            setNodes(nodes)
            setEdges(flowData.edges || [])

            // Add to history
            pushHistory('load_flow', nodes, flowData.edges || [], oldState, {
                description: 'Loaded flow from file',
                source: 'import'
            })

            setTimeout(() => setDirty(), 0)
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteFlow = async () => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete ${canvasTitle} ${chatflow.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                await chatflowsApi.deleteChatflow(chatflow.id)
                localStorage.removeItem(`${chatflow.id}_INTERNAL`)
                navigate('/agentflows')
            } catch (error) {
                enqueueSnackbar({
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    const handleSaveFlow = (chatflowName) => {
        if (reactFlowInstance) {
            const nodes = reactFlowInstance.getNodes().map((node) => {
                const nodeData = cloneDeep(node.data)
                if (Object.prototype.hasOwnProperty.call(nodeData.inputs, FLOWISE_CREDENTIAL_ID)) {
                    nodeData.credential = nodeData.inputs[FLOWISE_CREDENTIAL_ID]
                    nodeData.inputs = omit(nodeData.inputs, [FLOWISE_CREDENTIAL_ID])
                }
                node.data = {
                    ...nodeData,
                    selected: false,
                    status: undefined
                }
                return node
            })

            const edges = reactFlowInstance.getEdges().map((edge) => {
                const edgeData = cloneDeep(edge.data)
                return {
                    ...edge,
                    data: {
                        ...edgeData,
                        selected: false
                    }
                }
            })

            const flowData = {
                nodes,
                edges
            }

            if (chatflow.id) {
                updateChatflowApi.request(chatflow.id, {
                    name: chatflowName,
                    flowData: JSON.stringify(flowData)
                })
            } else {
                createNewChatflowApi.request({
                    name: chatflowName,
                    flowData: JSON.stringify(flowData),
                    type: 'AGENTFLOWV2'
                })
            }
        }
    }

    const onNodeClick = (event, node) => {
        setSelectedNode(node)
    }

    const onNodeDoubleClick = (event, node) => {
        setEditNodeDialogProps({
            node,
            reactFlowInstance
        })
        setEditNodeDialogOpen(true)
    }

    const onDrop = useCallback(
        (event) => {
            event.preventDefault()

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
            const data = JSON.parse(event.dataTransfer.getData('application/reactflow'))

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top
            })

            const newNode = {
                id: getUniqueNodeId(data.name),
                type: 'agentFlow',
                position,
                data: {
                    ...initNode(data, getUniqueNodeId(data.name)),
                    label: getUniqueNodeLabel(data.name)
                }
            }

            const oldState = { nodes, edges }
            const newNodes = nodes.map((node) => {
                return node
            })
            newNodes.push(newNode)

            setNodes(newNodes)

            // Add to history with enhanced tracking
            pushHistory('add_nodes', newNodes, edges, oldState, {
                description: `Added ${data.name} node`,
                source: 'drag_drop',
                selectedNodes: [newNode.id]
            })

            setTimeout(() => setDirty(), 0)
        },
        [reactFlowInstance, nodes, edges, pushHistory]
    )

    const onDragOver = useCallback((event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const syncNodes = () => {
        const componentNodes = canvas.componentNodes

        const cloneNodes = cloneDeep(nodes)
        const cloneEdges = cloneDeep(edges)
        let toBeRemovedEdges = []

        for (let i = 0; i < cloneNodes.length; i++) {
            const node = cloneNodes[i]
            const componentNode = componentNodes.find((cn) => cn.name === node.data.name)
            if (componentNode && componentNode.version > node.data.version) {
                const clonedComponentNode = cloneDeep(componentNode)
                cloneNodes[i].data = updateOutdatedNodeData(clonedComponentNode, node.data, true)
                toBeRemovedEdges.push(...updateOutdatedNodeEdge(cloneNodes[i].data, cloneEdges))
            }
        }

        const oldState = { nodes, edges }
        const newEdges = cloneEdges.filter((edge) => !toBeRemovedEdges.includes(edge))

        setNodes(cloneNodes)
        setEdges(newEdges)

        // Add to history
        pushHistory('sync_nodes', cloneNodes, newEdges, oldState, {
            description: 'Synced nodes with latest versions',
            source: 'system'
        })

        setDirty()
        setIsSyncNodesButtonEnabled(false)
    }

    const { reward: confettiReward } = useReward('canvasConfetti', 'confetti', {
        elementCount: 150,
        spread: 80,
        lifetime: 300,
        startVelocity: 40,
        zIndex: 10000,
        decay: 0.92,
        position: 'fixed'
    })

    const triggerConfetti = () => {
        setTimeout(() => {
            confettiReward()
        }, 50)
    }

    const saveChatflowSuccess = () => {
        enqueueSnackbar({
            message: `${canvasTitle} saved successfully!`,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'success',
                persist: false,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
        triggerConfetti()
    }

    const errorFailed = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const checkIfSyncNodesAvailable = (nodes) => {
        const componentNodes = canvas.componentNodes
        for (const node of nodes) {
            const componentNode = componentNodes.find((cn) => cn.name === node.data.name)
            if (componentNode && componentNode.version > node.data.version) {
                setIsSyncNodesButtonEnabled(true)
                return
            }
        }
        setIsSyncNodesButtonEnabled(false)
    }

    // Enhanced undo/redo handlers
    const handleUndo = () => {
        const previousState = undo()
        if (previousState) {
            setNodes(previousState.nodes)
            setEdges(previousState.edges)
            setDirty()
        }
    }

    const handleRedo = () => {
        const nextState = redo()
        if (nextState) {
            setNodes(nextState.nodes)
            setEdges(nextState.edges)
            setDirty()
        }
    }

    const handleRestore = (entry) => {
        setNodes(entry.nodes)
        setEdges(entry.edges)
        setDirty()
    }

    const handleClearHistory = () => {
        clearHistory()
        enqueueSnackbar({
            message: 'History cleared successfully',
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'success',
                persist: false
            }
        })
    }

    // Track node deletion
    const handleNodeDelete = useCallback(
        (nodeId) => {
            const oldState = { nodes, edges }
            const deletedNode = nodes.find((node) => node.id === nodeId)
            const newNodes = nodes.filter((node) => node.id !== nodeId)
            const newEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

            setNodes(newNodes)
            setEdges(newEdges)

            // Add to history
            pushHistory('delete_nodes', newNodes, newEdges, oldState, {
                description: `Deleted ${deletedNode?.data?.label || deletedNode?.type || 'node'}`,
                source: 'manual',
                deletedNode
            })

            setDirty()
        },
        [nodes, edges, pushHistory]
    )

    // Track node modification
    const handleNodeModify = useCallback(
        (nodeId, newData) => {
            const oldState = { nodes, edges }
            const newNodes = nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node))

            setNodes(newNodes)

            // Add to history
            pushHistory('modify_nodes', newNodes, edges, oldState, {
                description: `Modified ${newData.label || 'node'}`,
                source: 'manual',
                modifiedNodeId: nodeId,
                changes: newData
            })

            setDirty()
        },
        [nodes, edges, pushHistory]
    )

    // Track edge deletion
    const handleEdgeDelete = useCallback(
        (edgeId) => {
            const oldState = { nodes, edges }
            const deletedEdge = edges.find((edge) => edge.id === edgeId)
            const newEdges = edges.filter((edge) => edge.id !== edgeId)

            setEdges(newEdges)

            // Add to history
            pushHistory('delete_edges', nodes, newEdges, oldState, {
                description: `Deleted connection from ${deletedEdge?.source} to ${deletedEdge?.target}`,
                source: 'manual',
                deletedEdge
            })

            setDirty()
        },
        [nodes, edges, pushHistory]
    )

    // Track node dragging
    const handleNodeDragStop = useCallback(
        (event, node) => {
            const oldState = { nodes, edges }
            const newNodes = nodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))

            setNodes(newNodes)

            // Add to history (only if position actually changed)
            const originalNode = oldState.nodes.find((n) => n.id === node.id)
            if (originalNode && (originalNode.position.x !== node.position.x || originalNode.position.y !== node.position.y)) {
                pushHistory('move_nodes', newNodes, edges, oldState, {
                    description: `Moved ${node.data?.label || 'node'}`,
                    source: 'drag',
                    movedNodeId: node.id,
                    oldPosition: originalNode.position,
                    newPosition: node.position
                })
            }

            setDirty()
        },
        [nodes, edges, pushHistory]
    )

    // Set enhanced context value after handlers are defined
    useEffect(() => {
        setEnhancedFlowContextValue({
            ...flowContextValue,
            onNodeDelete: handleNodeDelete,
            onNodeModify: handleNodeModify,
            onEdgeDelete: handleEdgeDelete,
            onNodeDragStop: handleNodeDragStop
        })
    }, [flowContextValue, handleNodeDelete, handleNodeModify, handleEdgeDelete, handleNodeDragStop])

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                handleRedo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [canUndo, canRedo, handleUndo, handleRedo])

    // ==============================|| useEffect ||============================== //

    // Get specific chatflow successful
    useEffect(() => {
        if (getSpecificChatflowApi.data) {
            const chatflow = getSpecificChatflowApi.data
            const initialFlow = chatflow.flowData ? JSON.parse(chatflow.flowData) : []

            setNodes(initialFlow.nodes || [])
            setEdges(initialFlow.edges || [])

            // Add to history
            pushHistory('load_flow', initialFlow.nodes || [], initialFlow.edges || [], null, {
                description: `Loaded ${chatflow.name}`,
                source: 'load'
            })

            dispatch({ type: SET_CHATFLOW, chatflow })
        } else if (getSpecificChatflowApi.error) {
            errorFailed(`Failed to retrieve ${canvasTitle}: ${getSpecificChatflowApi.error.response.data.message}`)
        }
    }, [getSpecificChatflowApi.data, getSpecificChatflowApi.error])

    // Create new chatflow successful
    useEffect(() => {
        if (createNewChatflowApi.data) {
            const chatflow = createNewChatflowApi.data
            dispatch({ type: SET_CHATFLOW, chatflow })
            saveChatflowSuccess()
            window.history.replaceState(state, null, `/v2/agentcanvas/${chatflow.id}`)
        } else if (createNewChatflowApi.error) {
            errorFailed(`Failed to save ${canvasTitle}: ${createNewChatflowApi.error.response.data.message}`)
        }
    }, [createNewChatflowApi.data, createNewChatflowApi.error])

    // Update chatflow successful
    useEffect(() => {
        if (updateChatflowApi.data) {
            dispatch({ type: SET_CHATFLOW, chatflow: updateChatflowApi.data })
            saveChatflowSuccess()
        } else if (updateChatflowApi.error) {
            errorFailed(`Failed to save ${canvasTitle}: ${updateChatflowApi.error.response.data.message}`)
        }
    }, [updateChatflowApi.data, updateChatflowApi.error])

    useEffect(() => {
        setChatflow(canvasDataStore.chatflow)
        if (canvasDataStore.chatflow) {
            const flowData = canvasDataStore.chatflow.flowData ? JSON.parse(canvasDataStore.chatflow.flowData) : []
            checkIfSyncNodesAvailable(flowData.nodes || [])
        }
    }, [canvasDataStore.chatflow])

    // Initialization
    useEffect(() => {
        setIsSyncNodesButtonEnabled(false)
        if (chatflowId) {
            getSpecificChatflowApi.request(chatflowId)
        } else {
            if (localStorage.getItem('duplicatedFlowData')) {
                handleLoadFlow(localStorage.getItem('duplicatedFlowData'))
                setTimeout(() => localStorage.removeItem('duplicatedFlowData'), 0)
            } else {
                setNodes([])
                setEdges([])

                // Add initial state to history
                pushHistory('initial_state', [], [], null, {
                    description: 'Initial empty state',
                    source: 'system'
                })
            }
            dispatch({
                type: SET_CHATFLOW,
                chatflow: {
                    name: `Untitled ${canvasTitle}`
                }
            })
        }

        getNodesApi.request()

        // Clear dirty state before leaving and remove any ongoing test triggers and webhooks
        return () => {
            setTimeout(() => dispatch({ type: REMOVE_DIRTY }), 0)
        }
    }, [])

    useEffect(() => {
        setCanvasDataStore(canvas)
    }, [canvas])

    useEffect(() => {
        function handlePaste(e) {
            const pasteData = e.clipboardData.getData('text')
            //TODO: prevent paste event when input focused, temporary fix: catch chatflow syntax
            if (pasteData.includes('{"nodes":[') && pasteData.includes('],"edges":[')) {
                handleLoadFlow(pasteData)
            }
        }

        window.addEventListener('paste', handlePaste)

        return () => {
            window.removeEventListener('paste', handlePaste)
        }
    }, [])

    useEffect(() => {
        if (templateFlowData && templateFlowData.includes('"nodes":[') && templateFlowData.includes('],"edges":[')) {
            handleLoadFlow(templateFlowData)
        }
    }, [templateFlowData])

    usePrompt('You have unsaved changes! Do you want to navigate away?', canvasDataStore.isDirty)

    const [chatPopupOpen, setChatPopupOpen] = useState(false)

    useEffect(() => {
        if (!chatflowId && !localStorage.getItem('duplicatedFlowData') && getNodesApi.data && nodes.length === 0) {
            const startNodeData = getNodesApi.data.find((node) => node.name === 'startAgentflow')
            if (startNodeData) {
                const clonedStartNodeData = cloneDeep(startNodeData)
                clonedStartNodeData.position = { x: 100, y: 100 }
                const startNode = {
                    id: 'startAgentflow_0',
                    type: 'agentFlow',
                    position: { x: 100, y: 100 },
                    data: {
                        ...initNode(clonedStartNodeData, 'startAgentflow_0', true),
                        label: 'Start'
                    }
                }

                setNodes([startNode])
                setEdges([])

                // Add to history
                pushHistory('add_nodes', [startNode], [], null, {
                    description: 'Added start node',
                    source: 'system'
                })
            }
        }
    }, [getNodesApi.data, chatflowId])

    const [isPanelOpen, setPanelOpen] = useState(true)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)

    // Handler for CanvasHeader
    const handleOpenHistoryModal = () => {
        console.log('📚 [AGENTFLOW_CANVAS] History Modal Opened:', {
            timestamp: new Date().toISOString()
        })
        setHistoryModalOpen(true)
    }
    const handleCloseHistoryModal = () => {
        console.log('📚 [AGENTFLOW_CANVAS] History Modal Closed:', {
            timestamp: new Date().toISOString()
        })
        setHistoryModalOpen(false)
    }

    return (
        <>
            <span
                id='canvasConfetti'
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '0',
                    height: '0',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    background: 'transparent'
                }}
            />
            <Box sx={{ display: 'flex', height: '100vh' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <AppBar
                        enableColorOnDark
                        position='fixed'
                        color='inherit'
                        elevation={1}
                        sx={{
                            bgcolor: theme.palette.background.default
                        }}
                    >
                        <Toolbar>
                            <CanvasHeader
                                chatflow={chatflow}
                                handleSaveFlow={handleSaveFlow}
                                handleDeleteFlow={handleDeleteFlow}
                                handleLoadFlow={handleLoadFlow}
                                isAgentCanvas={true}
                                isAgentflowV2={true}
                                onOpenHistoryModal={handleOpenHistoryModal}
                            />
                        </Toolbar>
                    </AppBar>
                    <Box sx={{ pt: '70px', height: '100%', width: '100%' }}>
                        <div className='reactflow-parent-wrapper'>
                            <div className='reactflow-wrapper' ref={reactFlowWrapper}>
                                <flowContext.Provider value={enhancedFlowContextValue}>
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onNodeClick={onNodeClick}
                                        onNodeDoubleClick={onNodeDoubleClick}
                                        onEdgesChange={onEdgesChange}
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onNodeDragStop={handleNodeDragStop}
                                        nodeTypes={nodeTypes}
                                        edgeTypes={edgeTypes}
                                        onConnect={onConnect}
                                        onInit={setReactFlowInstance}
                                        fitView
                                        deleteKeyCode={canvas.canvasDialogShow ? null : ['Delete']}
                                        minZoom={0.5}
                                        snapGrid={[25, 25]}
                                        snapToGrid={isSnappingEnabled}
                                        connectionLineComponent={ConnectionLine}
                                    >
                                        <Controls
                                            className={customization.isDarkMode ? 'dark-mode-controls' : ''}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <button
                                                className='react-flow__controls-button react-flow__controls-interactive'
                                                onClick={() => {
                                                    setIsSnappingEnabled(!isSnappingEnabled)
                                                }}
                                                title='toggle snapping'
                                                aria-label='toggle snapping'
                                            >
                                                {isSnappingEnabled ? <IconMagnetFilled /> : <IconMagnetOff />}
                                            </button>
                                        </Controls>
                                        <MiniMap
                                            nodeStrokeWidth={3}
                                            nodeColor={customization.isDarkMode ? '#2d2d2d' : '#e2e2e2'}
                                            nodeStrokeColor={customization.isDarkMode ? '#525252' : '#fff'}
                                            maskColor={customization.isDarkMode ? 'rgb(45, 45, 45, 0.6)' : 'rgb(240, 240, 240, 0.6)'}
                                            style={{
                                                backgroundColor: customization.isDarkMode ? theme.palette.background.default : '#fff'
                                            }}
                                        />
                                        <Background color='#aaa' gap={16} />
                                        <AddNodes
                                            isAgentCanvas={true}
                                            isAgentflowv2={true}
                                            nodesData={getNodesApi.data}
                                            node={selectedNode}
                                            onFlowGenerated={triggerConfetti}
                                        />
                                        <EditNodeDialog
                                            show={editNodeDialogOpen}
                                            dialogProps={editNodeDialogProps}
                                            onCancel={() => setEditNodeDialogOpen(false)}
                                        />
                                        {isSyncNodesButtonEnabled && (
                                            <Fab
                                                sx={{
                                                    left: 60,
                                                    top: 20,
                                                    color: 'white',
                                                    background: 'orange',
                                                    '&:hover': {
                                                        background: 'orange',
                                                        backgroundImage: `linear-gradient(rgb(0 0 0/10%) 0 0)`
                                                    }
                                                }}
                                                size='small'
                                                aria-label='sync'
                                                title='Sync Nodes'
                                                onClick={() => syncNodes()}
                                            >
                                                <IconRefreshAlert />
                                            </Fab>
                                        )}
                                        <ChatPopUp isAgentCanvas={true} chatflowid={chatflowId} onOpenChange={setChatPopupOpen} />
                                        {!chatPopupOpen && <ValidationPopUp isAgentCanvas={true} chatflowid={chatflowId} />}
                                    </ReactFlow>
                                </flowContext.Provider>
                            </div>
                        </div>
                    </Box>
                    <ConfirmDialog />
                </Box>
                {/* Agentflow Generator Panel */}
                <AgentflowGeneratorPanel
                    open={isPanelOpen}
                    onClose={() => {
                        console.log('❌ [AGENTFLOW_CANVAS] Panel Close Triggered:', {
                            timestamp: new Date().toISOString()
                        })
                        setPanelOpen(false)
                    }}
                />

                {/* Show floating button when panel is collapsed */}
                {!isPanelOpen && (
                    <Fab
                        color='primary'
                        aria-label='open-generator-panel'
                        onClick={() => {
                            console.log('🎯 [AGENTFLOW_CANVAS] Panel Open Button Clicked:', {
                                timestamp: new Date().toISOString()
                            })
                            setPanelOpen(true)
                        }}
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                            zIndex: 1300,
                            boxShadow: 3
                        }}
                    >
                        <IconWand />
                    </Fab>
                )}

                {/* Enhanced History Modal */}
                <EnhancedHistoryModal
                    open={historyModalOpen}
                    onClose={handleCloseHistoryModal}
                    history={history}
                    historyIndex={historyIndex}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onRestore={handleRestore}
                    onClearHistory={handleClearHistory}
                />
            </Box>
        </>
    )
}

AgentflowCanvas.propTypes = {
    chatflowId: PropTypes.string
}

export default AgentflowCanvas
