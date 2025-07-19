import { useState, useEffect, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { Box, Typography, OutlinedInput, Button, Drawer, IconButton, Modal, Paper, Card } from '@mui/material'
import chatflowsApi from '@/api/chatflows'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import {
    IconX,
    IconChevronRight,
    IconAdjustments,
    IconMessage,
    IconWand,
    IconPlus,
    IconPointer,
    IconArrowBackUp
} from '@tabler/icons-react'
import useNotifier from '@/utils/useNotifier'
import { LoadingButton } from '@mui/lab'
import { flowContext } from '@/store/context/ReactFlowContext'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { useTheme } from '@mui/material/styles'
import assistantsApi from '@/api/assistants'
import { baseURL } from '@/store/constant'
import { initNode, showHideInputParams } from '@/utils/genericHelper'
import DocStoreInputHandler from '@/views/docstore/DocStoreInputHandler'
import useApi from '@/hooks/useApi'
import { cloneDeep } from 'lodash'
import credentialsApi from '@/api/credentials'
import Tooltip from '@mui/material/Tooltip'
import { applyCursorModifications, highlightModifications } from '@/utils/agentflowMerger'

const defaultInstructions = [
    { text: 'An agent that can autonomously search the web and generate report' },
    { text: 'Summarize a document' },
    { text: 'Generate response to user queries and send it to Slack' },
    { text: 'A team of agents that can handle all customer queries' }
]

const AgentflowGeneratorPanel = ({ open, onClose }) => {
    const [customAssistantInstruction, setCustomAssistantInstruction] = useState('')
    const [generatedInstruction, setGeneratedInstruction] = useState('')
    const [loading, setLoading] = useState(false)
    // Remove progress state and timer effect
    // Remove: const [progress, setProgress] = useState(0);
    // Remove the useEffect that sets progress and timer
    const [chatModelsComponents, setChatModelsComponents] = useState([])
    const [chatModelsOptions, setChatModelsOptions] = useState([])
    const [selectedChatModel, setSelectedChatModel] = useState({})
    const customization = useSelector((state) => state.customization)
    const getChatModelsApi = useApi(assistantsApi.getChatModels)
    const { reactFlowInstance } = useContext(flowContext)
    const theme = useTheme()
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))
    const [showModelFields, setShowModelFields] = useState(false)

    // Conversation state
    const conversationStorageKey = 'agentflow_conversation_history'
    const [conversation, setConversation] = useState(() => {
        const saved = localStorage.getItem(conversationStorageKey)
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                return [{ role: 'system', content: 'Welcome! Please select a model to start.' }]
            }
        }
        return [{ role: 'system', content: 'Welcome! Please select a model to start.' }]
    })
    const [userMessage, setUserMessage] = useState('')
    const [pendingLLM, setPendingLLM] = useState(false)

    // Model selection state
    const [modelSelectionActive, setModelSelectionActive] = useState(false)

    // Model selection modal state
    const [modelModalOpen, setModelModalOpen] = useState(false)

    const [chatType, setChatType] = useState('generate') // 'generate' or 'talk'

    // Cursor mode state
    const [cursorMode, setCursorMode] = useState(false)
    const [selectedNodes, setSelectedNodes] = useState([])
    const [flowHistory, setFlowHistory] = useState([])
    const [modificationHistory, setModificationHistory] = useState([])
    const [backendDebugLogs, setBackendDebugLogs] = useState([])

    const handleChatModelDataChange = ({ inputParam, newValue }) => {
        setSelectedChatModel((prevData) => {
            const updatedData = { ...prevData }
            updatedData.inputs[inputParam.name] = newValue
            updatedData.inputParams = showHideInputParams(updatedData)
            return updatedData
        })
    }

    useEffect(() => {
        if (getChatModelsApi.data) {
            setChatModelsComponents(getChatModelsApi.data)
            const options = getChatModelsApi.data.map((chatModel) => ({
                label: chatModel.label,
                name: chatModel.name,
                imageSrc: `${baseURL}/api/v1/node-icon/${chatModel.name}`
            }))
            setChatModelsOptions(options)

            // Prefill logic: always select chatOpenRouter with required values
            const foundChatComponent = getChatModelsApi.data.find((chatModel) => chatModel.name === 'chatOpenRouter')
            if (foundChatComponent) {
                const chatModelId = `${foundChatComponent.name}_0`
                const clonedComponent = cloneDeep(foundChatComponent)
                const initChatModelData = initNode(clonedComponent, chatModelId)
                // Fetch credentials for openRouterApi
                credentialsApi.getCredentialsByName('openRouterApi').then((resp) => {
                    let credentialId = ''
                    if (resp.data && resp.data.length > 0) {
                        const foundOr1 = resp.data.find((cred) => cred.id === 'or1' || cred.name === 'or1')
                        if (foundOr1) {
                            credentialId = foundOr1.id
                        } else {
                            credentialId = resp.data[0].id
                        }
                        initChatModelData.inputs = {
                            ...initChatModelData.inputs,
                            credential: credentialId,
                            FLOWISE_CREDENTIAL_ID: credentialId,
                            modelName: 'deepseek/deepseek-chat-v3-0324:free'
                        }
                        if ('credential' in initChatModelData) {
                            initChatModelData.credential = credentialId
                        }
                        setSelectedChatModel(initChatModelData)
                    } else {
                        // No credentials available, just prefill modelName
                        initChatModelData.inputs = {
                            ...initChatModelData.inputs,
                            modelName: 'deepseek/deepseek-chat-v3-0324:free'
                        }
                        setSelectedChatModel(initChatModelData)
                    }
                })
            } else {
                setSelectedChatModel({})
            }
        }
    }, [getChatModelsApi.data, open])

    // Remove progress state and timer effect
    // Remove: useEffect(() => {
    // Remove:     let timer;
    // Remove:     if (loading) {
    // Remove:         setProgress(0);
    // Remove:         timer = setInterval(() => {
    // Remove:             setProgress((prevProgress) => {
    // Remove:                 if (prevProgress >= 95) {
    // Remove:                     clearInterval(timer);
    // Remove:                     return 95;
    // Remove:                 }
    // Remove:                 const increment = prevProgress < 30 ? 3 : prevProgress < 60 ? 5 : prevProgress < 80 ? 2 : 0.5;
    // Remove:                 return Math.min(prevProgress + increment, 95);
    // Remove:             });
    // Remove:         }, 500);
    // Remove:     } else {
    // Remove:         setProgress(100);
    // Remove:     }
    // Remove:     return () => { if (timer) clearInterval(timer); };
    // Remove: }, [loading]);

    useEffect(() => {
        if (open) getChatModelsApi.request()
    }, [open])

    // Save conversation to localStorage on every change
    useEffect(() => {
        localStorage.setItem(conversationStorageKey, JSON.stringify(conversation))
    }, [conversation])

    // Clear conversation history when model changes
    useEffect(() => {
        if (modelSelectionActive) {
            setConversation([{ role: 'system', content: 'Welcome! Please select a model to start.' }])
            localStorage.removeItem(conversationStorageKey)
        }
    }, [modelSelectionActive])

    const onGenerate = async () => {
        if (!customAssistantInstruction.trim()) return
        try {
            setLoading(true)
            const response = await chatflowsApi.generateAgentflow({
                question: customAssistantInstruction.trim(),
                selectedChatModel: selectedChatModel
            })
            if (response.data && response.data.nodes && response.data.edges) {
                reactFlowInstance.setNodes(response.data.nodes)
                reactFlowInstance.setEdges(response.data.edges)
                // Optionally reset/collapse panel here
            } else {
                enqueueSnackbar({
                    message: response.error || 'Failed to generate agentflow',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: false,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        } catch (error) {
            enqueueSnackbar({
                message: error.response?.data?.message || 'Failed to generate agentflow',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: false,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setLoading(false)
        }
    }

    // Enhanced: Handle sending a user message in the chat with cursor mode support
    const handleSendMessage = async () => {
        const trimmed = userMessage.trim()
        if (!trimmed || loading || pendingLLM) return
        console.log('[CursorMode] User clicked send. Message:', trimmed)
        setConversation((prev) => [...prev, { role: 'user', content: trimmed }])
        setUserMessage('')
        setPendingLLM(true)

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log('[handleSendMessage] Timeout reached - forcing loading states to false')
            setLoading(false)
            setPendingLLM(false)
            setConversation((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Request timed out. Please try again.'
                }
            ])
        }, 30000) // 30 second timeout

        try {
            setLoading(true)
            let response

            if (cursorMode) {
                // Cursor mode: modify existing flow
                const currentFlow = {
                    nodes: reactFlowInstance.getNodes(),
                    edges: reactFlowInstance.getEdges()
                }
                console.log('[CursorMode] Preparing API call with currentFlow:', currentFlow)
                // Save current state for undo
                setFlowHistory((prev) => [...prev, currentFlow])

                response = await chatflowsApi.generateAgentflowCursor({
                    question: trimmed,
                    selectedChatModel: selectedChatModel,
                    currentFlow: currentFlow,
                    selectedNodeIds: selectedNodes.map((n) => n.id)
                })
                console.log('[CursorMode] API response:', response)
                console.log('[CursorMode] API response.data:', response.data)
                console.log('[CursorMode] API response.data keys:', response.data ? Object.keys(response.data) : 'no data')

                // Show backend debug logs in browser console and UI
                if (response.data && response.data.debugLogs) {
                    response.data.debugLogs.forEach((log) => {
                        console.log('[backend-debug]', log)
                    })
                    setBackendDebugLogs(response.data.debugLogs)
                } else {
                    setBackendDebugLogs([])
                }

                // Print backend input/output debug data
                if (response.data && response.data.debugData) {
                    console.log('[backend-debug] INPUT:', response.data.debugData.input)
                    console.log('[backend-debug] OUTPUT:', response.data.debugData.output)
                }

                // Step 2: Print AI model calls (input/output) if present
                if (response.data && response.data.aiModelCalls) {
                    response.data.aiModelCalls.forEach((call, idx) => {
                        console.log(`[ai-model-call ${idx}] INPUT:`, call.input)
                        console.log(`[ai-model-call ${idx}] OUTPUT:`, call.output)
                    })
                }

                // Handle both response formats: complete flow or modifications
                if (response.data && response.data.nodes && response.data.edges) {
                    // Complete flow response (like generation mode)
                    console.log('[CursorMode] Complete flow response received:', response.data)

                    // Apply the complete flow to the canvas
                    reactFlowInstance.setNodes(response.data.nodes)
                    reactFlowInstance.setEdges(response.data.edges)

                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: 'Flow updated successfully! The AI has provided a complete updated flow based on your request.',
                            nodes: response.data.nodes,
                            edges: response.data.edges
                        }
                    ])
                } else if (response.data && response.data.modifications) {
                    // Modifications response (original cursor mode format)
                    console.log('[CursorMode] Modifications response received:', response.data)
                    const result = applyCursorModifications(currentFlow, response.data.modifications)
                    console.log('[CursorMode] Modifications applied:', result)

                    if (result.success) {
                        // Update canvas with modifications
                        reactFlowInstance.setNodes(result.nodes)
                        reactFlowInstance.setEdges(result.edges)
                        // Highlight modifications
                        highlightModifications(reactFlowInstance, result.highlightedElements)
                        // Save modification history
                        setModificationHistory((prev) => [
                            ...prev,
                            {
                                modifications: response.data.modifications,
                                reasoning: response.data.reasoning,
                                timestamp: Date.now()
                            }
                        ])
                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.reasoning || 'Modifications applied successfully!',
                                modifications: response.data.modifications,
                                confidence: response.data.confidence
                            }
                        ])
                    } else {
                        console.error('[CursorMode] Failed to apply modifications:', result.error)
                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: `Failed to apply modifications: ${result.error}`
                            }
                        ])
                    }
                } else {
                    console.error('[CursorMode] API did not return valid response format:', response.data)
                    // Handle error responses from backend
                    const errorMessage =
                        response.data?.reasoning || response.data?.error || response.data?.message || 'Failed to process cursor request.'

                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: errorMessage
                        }
                    ])
                }
            } else if (chatType === 'generate') {
                // Existing agentflow generation logic
                const historyForBackend = conversation
                    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
                    .map((msg) => ({ role: msg.role, content: msg.content }))
                response = await chatflowsApi.generateAgentflow({
                    question: trimmed,
                    selectedChatModel: selectedChatModel,
                    history: historyForBackend
                })

                console.log('[GenerateMode] API response:', response)
                console.log('[GenerateMode] API response.data:', response.data)
                console.log('[GenerateMode] API response.data keys:', response.data ? Object.keys(response.data) : 'no data')

                if (response.data && response.data.nodes && response.data.edges) {
                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: 'Here is your generated Agentflow! You can apply it to the canvas or ask for changes.',
                            nodes: response.data.nodes,
                            edges: response.data.edges
                        }
                    ])
                } else {
                    console.error('[GenerateMode] API did not return valid response format:', response.data)
                    const errorMessage =
                        response.data?.reasoning ||
                        response.data?.error ||
                        response.data?.message ||
                        response.error ||
                        'Failed to generate agentflow.'

                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: errorMessage
                        }
                    ])
                }
            } else {
                // 'talk' mode: just send prompt to model, no context/history
                response = await chatflowsApi.generateAgentflow({
                    question: trimmed,
                    selectedChatModel: selectedChatModel
                })

                setConversation((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: response.data?.text || response.data?.message || response.error || 'No response.'
                    }
                ])
            }
        } catch (error) {
            setConversation((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: error.response?.data?.message || 'Failed to process request.'
                }
            ])
        } finally {
            console.log('[handleSendMessage] Finally block - setting loading states to false')
            clearTimeout(timeoutId) // Clear the timeout
            setLoading(false)
            setPendingLLM(false)
        }
    }

    // Show model selection UI if no model is selected
    useEffect(() => {
        if (open && (!selectedChatModel || !selectedChatModel.name)) {
            setModelSelectionActive(true)
        } else {
            setModelSelectionActive(false)
        }
    }, [open, selectedChatModel])

    // New: Open model modal from button
    const openModelModal = () => setModelModalOpen(true)
    const closeModelModal = () => setModelModalOpen(false)

    // New: Handle model selection from modal
    const handleModelSelect = (newValue) => {
        if (!newValue) {
            setSelectedChatModel({})
        } else {
            const foundChatComponent = chatModelsComponents.find((chatModel) => chatModel.name === newValue)
            if (foundChatComponent) {
                const chatModelId = `${foundChatComponent.name}_0`
                const clonedComponent = cloneDeep(foundChatComponent)
                const initChatModelData = initNode(clonedComponent, chatModelId)
                setSelectedChatModel(initChatModelData)
            }
        }
    }

    // Add a 'Change Model' button to the chat UI
    const handleChangeModel = () => {
        setModelSelectionActive(true)
    }

    // Add a system message after model selection
    useEffect(() => {
        if (!modelSelectionActive && selectedChatModel && selectedChatModel.name) {
            setConversation((prev) => {
                // Only add if not already present
                if (prev.some((msg) => msg.role === 'system' && msg.content.includes('Model selected'))) return prev
                return [
                    ...prev,
                    {
                        role: 'system',
                        content: `Model selected: ${selectedChatModel.label || selectedChatModel.name}. Now describe your agent.`
                    }
                ]
            })
        }
    }, [modelSelectionActive, selectedChatModel])

    // Add state for selected nodes
    const [selectedNodeIds, setSelectedNodeIds] = useState([])

    // Handle undo functionality
    const handleUndo = () => {
        if (flowHistory.length > 0) {
            const previousState = flowHistory[flowHistory.length - 1]
            reactFlowInstance.setNodes(previousState.nodes)
            reactFlowInstance.setEdges(previousState.edges)
            setFlowHistory((prev) => prev.slice(0, -1))

            setConversation((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Undo completed. Previous state restored.'
                }
            ])
        }
    }

    // Test cursor mode functionality
    const testCursorMode = () => {
        if (!cursorMode) {
            setCursorMode(true)
        }

        const testMessage = 'Add a condition node after the current node'
        setUserMessage(testMessage)

        setConversation((prev) => [
            ...prev,
            {
                role: 'user',
                content: testMessage
            }
        ])

        // Simulate the cursor mode request
        setTimeout(() => {
            handleSendMessage()
        }, 100)
    }

    // Test generation mode functionality
    const testGenerationMode = () => {
        if (cursorMode) {
            setCursorMode(false)
        }

        const testMessage = 'Create a simple workflow that searches the web and summarizes the results'
        setUserMessage(testMessage)

        setConversation((prev) => [
            ...prev,
            {
                role: 'user',
                content: testMessage
            }
        ])

        // Simulate the generation mode request
        setTimeout(() => {
            handleSendMessage()
        }, 100)
    }

    // New: Render model selection modal
    const renderModelSelectionModal = () => (
        <Modal open={modelModalOpen} onClose={closeModelModal}>
            <Paper
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: 350,
                    maxWidth: 500,
                    maxHeight: '80vh',
                    p: 3,
                    outline: 'none',
                    overflow: 'auto',
                    boxShadow: 24,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Typography variant='h6' sx={{ mb: 2 }}>
                    Select a model to start the conversation<span style={{ color: 'red' }}>&nbsp;*</span>
                </Typography>
                <Dropdown
                    key={JSON.stringify(selectedChatModel)}
                    name={'chatModel'}
                    options={chatModelsOptions ?? []}
                    onSelect={handleModelSelect}
                    value={selectedChatModel ? selectedChatModel?.name : 'choose an option'}
                />
                <Box sx={{ flex: 1, overflowY: 'auto', mt: 2 }}>
                    {selectedChatModel && Object.keys(selectedChatModel).length > 0 && (
                        <Box sx={{ p: 0, mb: 1, border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}>
                            {showHideInputParams(selectedChatModel)
                                .filter((inputParam) => !inputParam.hidden && inputParam.display !== false)
                                .map((inputParam, index) => (
                                    <DocStoreInputHandler
                                        key={index}
                                        inputParam={inputParam}
                                        data={selectedChatModel}
                                        onNodeDataChange={handleChatModelDataChange}
                                    />
                                ))}
                        </Box>
                    )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={() => {
                            closeModelModal()
                            setModelSelectionActive(false)
                        }}
                    >
                        Confirm
                    </Button>
                </Box>
            </Paper>
        </Modal>
    )

    // New: Render model selection UI as part of chat flow
    const renderModelSelection = () => (
        <Box sx={{ mt: 2 }}>
            <Typography>
                Select a model to start the conversation<span style={{ color: 'red' }}>&nbsp;*</span>
            </Typography>
            <Dropdown
                key={JSON.stringify(selectedChatModel)}
                name={'chatModel'}
                options={chatModelsOptions ?? []}
                onSelect={handleModelSelect}
                value={selectedChatModel ? selectedChatModel?.name : 'choose an option'}
            />
            {selectedChatModel && Object.keys(selectedChatModel).length > 0 && (
                <Box sx={{ p: 0, mt: 1, mb: 1, border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}>
                    {showHideInputParams(selectedChatModel)
                        .filter((inputParam) => !inputParam.hidden && inputParam.display !== false)
                        .map((inputParam, index) => (
                            <DocStoreInputHandler
                                key={index}
                                inputParam={inputParam}
                                data={selectedChatModel}
                                onNodeDataChange={handleChatModelDataChange}
                            />
                        ))}
                </Box>
            )}
        </Box>
    )

    return (
        <Drawer anchor='right' open={open} onClose={onClose} variant='persistent' PaperProps={{ sx: { width: 400 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant='h6' sx={{ flex: 1 }}>
                    Generate Agentflow
                </Typography>
                <IconButton onClick={onClose}>
                    <IconChevronRight />
                </IconButton>
            </Box>

            {/* Cursor Mode Toggle */}
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Button
                        variant={cursorMode ? 'contained' : 'outlined'}
                        size='small'
                        startIcon={<IconPointer />}
                        onClick={() => setCursorMode(!cursorMode)}
                        sx={{ flex: 1 }}
                    >
                        {cursorMode ? 'Cursor Mode' : 'Generate New'}
                    </Button>
                    {modificationHistory.length > 0 && (
                        <Tooltip title='Undo Last Modification'>
                            <IconButton size='small' onClick={handleUndo} disabled={flowHistory.length === 0}>
                                <IconArrowBackUp />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {cursorMode && (
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: 'info.light',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'info.main'
                        }}
                    >
                        <Typography variant='caption' color='info.contrastText'>
                            <strong>Cursor Mode Active:</strong> AI will modify your existing flow based on your request. Selected nodes
                            will be used as connection points.
                        </Typography>
                        <Button size='small' variant='outlined' onClick={testCursorMode} sx={{ mt: 1, width: '100%' }}>
                            Test Cursor Mode
                        </Button>
                        <Button size='small' variant='outlined' onClick={testGenerationMode} sx={{ mt: 1, width: '100%' }}>
                            Test Generation Mode
                        </Button>
                    </Box>
                )}
            </Box>
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Always show chat UI, never show loading animation */}
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, minHeight: 0 }}>
                    {/* Chat UI */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            mb: 2,
                            border: '1px solid #eee',
                            borderRadius: 2,
                            p: 1,
                            background: customization.isDarkMode ? '#23272f' : '#fafbfc',
                            minHeight: 0
                        }}
                    >
                        {conversation.map((msg, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <Box
                                    sx={{
                                        bgcolor: msg.role === 'user' ? theme.palette.primary.light : theme.palette.grey[200],
                                        color: msg.role === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        maxWidth: '80%',
                                        boxShadow: 1
                                    }}
                                >
                                    <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                                        {msg.content}
                                    </Typography>
                                    {/* If LLM message has nodes/edges, show a preview button */}
                                    {msg.role === 'assistant' && msg.nodes && msg.edges && (
                                        <>
                                            {/* Node list UI above Add all nodes button */}
                                            {Array.isArray(msg.nodes) && msg.nodes.length > 0 && (
                                                <Box sx={{ mb: 1 }}>
                                                    {msg.nodes.map((node, i) => (
                                                        <Card
                                                            key={node.id || i}
                                                            sx={{
                                                                mb: 1,
                                                                p: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between'
                                                            }}
                                                        >
                                                            <Box>
                                                                <Typography variant='subtitle1'>
                                                                    {node.data?.label || node.data?.name || node.type || 'Node'}
                                                                </Typography>
                                                                <Tooltip
                                                                    title={node.data?.description || node.data?.desc || ''}
                                                                    placement='top'
                                                                    arrow
                                                                >
                                                                    <Typography
                                                                        variant='body2'
                                                                        color='text.secondary'
                                                                        sx={{
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            maxWidth: 220
                                                                        }}
                                                                    >
                                                                        {node.data?.description || node.data?.desc || ''}
                                                                    </Typography>
                                                                </Tooltip>
                                                            </Box>
                                                            <IconButton
                                                                color='primary'
                                                                onClick={() => {
                                                                    // Add this node and all outgoing edges from this node
                                                                    const nodeId = node.id
                                                                    const outgoingEdges = Array.isArray(msg.edges)
                                                                        ? msg.edges.filter((e) => e.source === nodeId)
                                                                        : []
                                                                    reactFlowInstance.setNodes([node])
                                                                    reactFlowInstance.setEdges(outgoingEdges)
                                                                }}
                                                                aria-label='Add node'
                                                            >
                                                                <IconPlus />
                                                            </IconButton>
                                                        </Card>
                                                    ))}
                                                    <Button
                                                        size='small'
                                                        sx={{ mt: 1, width: '100%' }}
                                                        variant='contained'
                                                        onClick={() => {
                                                            // Add all nodes and all edges
                                                            reactFlowInstance.setNodes(msg.nodes)
                                                            reactFlowInstance.setEdges(msg.edges)
                                                        }}
                                                    >
                                                        Add all nodes
                                                    </Button>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ))}
                        {pendingLLM && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
                                <Box
                                    sx={{ bgcolor: theme.palette.grey[200], px: 2, py: 1, borderRadius: 2, maxWidth: '80%', boxShadow: 1 }}
                                >
                                    <Typography variant='body2'>Generating...</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                    {/* If no model is selected, show a button to open the model selection modal */}
                    {modelSelectionActive ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                            <Button variant='contained' color='primary' onClick={openModelModal}>
                                Select Model
                            </Button>
                            {renderModelSelectionModal()}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                            <OutlinedInput
                                sx={{ flex: 1 }}
                                type='text'
                                placeholder='Type your request...'
                                value={userMessage}
                                onChange={(e) => setUserMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }
                                }}
                                disabled={loading || pendingLLM}
                            />
                            <LoadingButton
                                loading={loading || pendingLLM}
                                variant='contained'
                                onClick={handleSendMessage}
                                disabled={!userMessage.trim() || loading || pendingLLM}
                            >
                                Send
                            </LoadingButton>
                            <Tooltip title={chatType === 'generate' ? 'Generate Agentflow (default)' : 'Switch to Generate Agentflow'}>
                                <IconButton
                                    color={chatType === 'generate' ? 'primary' : 'default'}
                                    onClick={() => setChatType('generate')}
                                    disabled={loading || pendingLLM}
                                    sx={{ p: 1 }}
                                    aria-label='Generate Agentflow Chat Type'
                                >
                                    <IconWand />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={chatType === 'talk' ? 'Talk to AI (no context)' : 'Switch to Talk to AI'}>
                                <IconButton
                                    color={chatType === 'talk' ? 'primary' : 'default'}
                                    onClick={() => setChatType('talk')}
                                    disabled={loading || pendingLLM}
                                    sx={{ p: 1 }}
                                    aria-label='Talk to AI Chat Type'
                                >
                                    <IconMessage />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Change Model'>
                                <IconButton
                                    color='secondary'
                                    onClick={openModelModal}
                                    disabled={modelModalOpen || loading || pendingLLM}
                                    sx={{ p: 1 }}
                                    aria-label='Change Model'
                                >
                                    <IconAdjustments />
                                </IconButton>
                            </Tooltip>
                            {renderModelSelectionModal()}
                        </Box>
                    )}
                </Box>
                {/* Backend Debug Logs Panel */}
                {backendDebugLogs.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: '#222', color: '#fff', borderRadius: 2, mt: 2 }}>
                        <Typography variant='subtitle2'>Backend Debug Logs:</Typography>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{backendDebugLogs.join('\n')}</pre>
                    </Box>
                )}
            </Box>
        </Drawer>
    )
}

AgentflowGeneratorPanel.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default AgentflowGeneratorPanel
