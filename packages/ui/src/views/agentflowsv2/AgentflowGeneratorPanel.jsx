import { useState, useEffect, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import {
    Box,
    Typography,
    OutlinedInput,
    Button,
    Drawer,
    IconButton,
    Modal,
    Paper,
    Card,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import chatflowsApi from '@/api/chatflows'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import { IconX, IconChevronRight, IconAdjustments, IconMessage, IconWand, IconPlus, IconArrowBackUp } from '@tabler/icons-react'
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

    // Current flow state
    const [currentFlow, setCurrentFlow] = useState({ nodes: [], edges: [] })

    // Logging state
    const [backendLogs, setBackendLogs] = useState([])

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

    // Keep currentFlow in sync with ReactFlow instance
    useEffect(() => {
        if (reactFlowInstance) {
            const nodes = reactFlowInstance.getNodes()
            const edges = reactFlowInstance.getEdges()
            setCurrentFlow({ nodes, edges })
        }
    }, [reactFlowInstance])

    // Update currentFlow when ReactFlow instance changes
    useEffect(() => {
        if (reactFlowInstance) {
            const nodes = reactFlowInstance.getNodes()
            const edges = reactFlowInstance.getEdges()
            setCurrentFlow({ nodes, edges })
        }
    }, [reactFlowInstance])

    const onGenerate = async () => {
        if (!customAssistantInstruction.trim()) return

        // Log generate button click
        console.log('🎯 [AGENTFLOW_GENERATOR] Generate Button Clicked:', {
            instruction: customAssistantInstruction.trim(),
            timestamp: new Date().toISOString()
        })

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
        if (!trimmed || loading) return

        // Log user input
        console.log('🚀 [AGENTFLOW_GENERATOR] User Input:', {
            message: trimmed,
            timestamp: new Date().toISOString(),
            sessionId: Date.now().toString()
        })

        setConversation((prev) => [
            ...prev,
            {
                role: 'user',
                content: trimmed
            }
        ])

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

            // Log API request
            const sessionId = Date.now().toString()
            console.log('📡 [AGENTFLOW_GENERATOR] API Request:', {
                message: trimmed,
                selectedChatModel: selectedChatModel.name,
                currentFlowNodes: currentFlow.nodes.length,
                currentFlowEdges: currentFlow.edges.length,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            })

            // Log AI Model Input
            console.log('🤖 [AI_MODEL_INPUT] Sending to AI Model:', {
                userMessage: trimmed,
                selectedModel: selectedChatModel.name,
                modelConfiguration: {
                    temperature: selectedChatModel.inputs?.temperature,
                    maxTokens: selectedChatModel.inputs?.maxTokens,
                    modelName: selectedChatModel.inputs?.modelName
                },
                currentFlowState: {
                    nodes: currentFlow.nodes.map((n) => ({ id: n.id, type: n.type, label: n.data?.label })),
                    edges: currentFlow.edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
                },
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            })

            // Use the new conversational API for all messages
            response = await chatflowsApi.processConversationalMessage({
                message: trimmed,
                selectedChatModel: selectedChatModel,
                currentFlow: currentFlow,
                sessionId: sessionId
            })

            // New: Handle context, nodes/edges, and explanation in order
            if (response.data && (response.data.nodes || response.data.edges || response.data.context || response.data.explanation)) {
                // 1. Context (before nodes/edges)
                if (response.data.context) {
                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: response.data.context,
                            type: 'context'
                        }
                    ])
                }
                // 2. Nodes/edges (the workflow)
                if (response.data.nodes && response.data.edges) {
                    reactFlowInstance.setNodes(response.data.nodes)
                    reactFlowInstance.setEdges(response.data.edges)
                    setCurrentFlow({ nodes: response.data.nodes, edges: response.data.edges })
                }
                // 3. Explanation (after nodes/edges)
                if (response.data.explanation) {
                    setConversation((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: response.data.explanation,
                            type: 'explanation'
                        }
                    ])
                }
                return
            }

            // Log AI Model Output
            console.log('🤖 [AI_MODEL_OUTPUT] Received from AI Model:', {
                responseStatus: response.status,
                responseType: response.data?.type,
                aiResponse: {
                    content: response.data?.content,
                    type: response.data?.type,
                    modifications: response.data?.modifications,
                    flow: response.data?.flow
                        ? {
                              nodesCount: response.data.flow.nodes?.length,
                              edgesCount: response.data.flow.edges?.length
                          }
                        : null,
                    searchResults: response.data?.results
                        ? {
                              query: response.data.searchQuery,
                              resultsCount: response.data.results.length
                          }
                        : null
                },
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            })

            // Log API response
            console.log('📥 [AGENTFLOW_GENERATOR] API Response:', {
                status: response.status,
                responseType: response.data?.type,
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : [],
                timestamp: new Date().toISOString()
            })

            // Log backend logs if available
            if (response.data?.logs) {
                console.log('🔍 [AGENTFLOW_GENERATOR] Backend Logs:', response.data.logs)
                setBackendLogs((prev) => [...prev, ...response.data.logs])
            }

            if (response.data && response.data.type) {
                // Handle different response types
                switch (response.data.type) {
                    case 'chat_response':
                        // Log AI chat response processing
                        console.log('💬 [AI_MODEL_PROCESSING] Processing Chat Response:', {
                            aiResponseContent: response.data.content,
                            responseLength: response.data.content?.length,
                            processingType: 'chat_response',
                            timestamp: new Date().toISOString()
                        })

                        // General chat response
                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.content
                            }
                        ])
                        break

                    case 'web_search_results':
                        // Log AI web search processing
                        console.log('🌐 [AI_MODEL_PROCESSING] Processing Web Search Results:', {
                            aiGeneratedQuery: response.data.searchQuery,
                            aiFoundResults: response.data.results?.length || 0,
                            aiResponseContent: response.data.content,
                            processingType: 'web_search_results',
                            timestamp: new Date().toISOString()
                        })

                        // Web search results
                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.content,
                                searchResults: response.data.results,
                                searchQuery: response.data.searchQuery
                            }
                        ])
                        break

                    case 'agentflow_modification':
                        // Log AI agentflow modification processing
                        console.log('🔧 [AI_MODEL_PROCESSING] Processing Agentflow Modification:', {
                            aiGeneratedModifications: response.data.modifications?.length || 0,
                            aiModificationDetails: response.data.modifications,
                            aiResponseContent: response.data.content,
                            processingType: 'agentflow_modification',
                            timestamp: new Date().toISOString()
                        })

                        // Agentflow modification
                        if (response.data.modifications) {
                            const result = applyCursorModifications(currentFlow, response.data.modifications)
                            console.log('🔧 [AI_MODEL_POST_PROCESSING] Modifications Applied:', {
                                aiModificationsSuccess: result.success,
                                aiGeneratedNodes: result.nodes?.length || 0,
                                aiGeneratedEdges: result.edges?.length || 0,
                                aiHighlightedElements: result.highlightedElements?.length || 0,
                                postProcessingResult: result,
                                timestamp: new Date().toISOString()
                            })

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
                                        timestamp: new Date().toISOString()
                                    }
                                ])
                            }
                        }

                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.content
                            }
                        ])
                        break

                    case 'complete_workflow':
                        // Log AI complete workflow processing
                        console.log('🎯 [AI_MODEL_PROCESSING] Processing Complete Workflow:', {
                            aiGeneratedFlow: !!response.data.flow,
                            aiGeneratedNodes: response.data.flow?.nodes?.length || 0,
                            aiGeneratedEdges: response.data.flow?.edges?.length || 0,
                            aiResponseContent: response.data.content,
                            aiWorkflowData: response.data.flow,
                            processingType: 'complete_workflow',
                            timestamp: new Date().toISOString()
                        })

                        // Complete workflow creation
                        if (response.data.flow && response.data.flow.nodes && response.data.flow.edges) {
                            // Set the complete flow
                            reactFlowInstance.setNodes(response.data.flow.nodes)
                            reactFlowInstance.setEdges(response.data.flow.edges)

                            // Save the flow
                            setCurrentFlow({
                                nodes: response.data.flow.nodes,
                                edges: response.data.flow.edges
                            })

                            console.log('🎯 [AI_MODEL_POST_PROCESSING] Complete Workflow Applied:', {
                                aiGeneratedNodesApplied: response.data.flow.nodes.length,
                                aiGeneratedEdgesApplied: response.data.flow.edges.length,
                                aiWorkflowApplied: true,
                                postProcessingResult: 'Workflow successfully applied to canvas',
                                timestamp: new Date().toISOString()
                            })
                        }

                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.content,
                                workflowData: {
                                    researchResults: response.data.researchResults,
                                    testResults: response.data.testResults,
                                    iterations: response.data.iterations
                                }
                            }
                        ])
                        break

                    default:
                        // Log unknown AI response type
                        console.log('❓ [AI_MODEL_PROCESSING] Unknown AI Response Type:', {
                            aiResponseType: response.data.type,
                            aiResponseContent: response.data.content,
                            processingType: 'unknown_response',
                            timestamp: new Date().toISOString()
                        })

                        // Fallback for unknown response types
                        setConversation((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: response.data.content || 'I processed your request successfully.'
                            }
                        ])
                }
            } else {
                console.error('[ConversationalMode] API did not return valid response format:', response.data)
                // Handle error responses from backend
                const errorMessage =
                    response.data?.reasoning || response.data?.error || response.data?.message || 'Failed to process your request.'

                setConversation((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: errorMessage
                    }
                ])
            }
        } catch (error) {
            console.error('❌ [AI_MODEL_ERROR] AI Model Processing Error:', {
                errorMessage: error.message,
                errorResponse: error.response?.data,
                aiModelName: selectedChatModel.name,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            })

            setConversation((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: error.response?.data?.error || error.message || 'An error occurred while processing your request.'
                }
            ])
        } finally {
            const finalSessionId = sessionId || Date.now().toString()
            console.log('✅ [AI_MODEL_COMPLETED] AI Model Request Completed:', {
                sessionId: finalSessionId,
                aiModelName: selectedChatModel.name,
                totalProcessingTime: Date.now() - parseInt(finalSessionId),
                timestamp: new Date().toISOString()
            })
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
    const openModelModal = () => {
        console.log('🔧 [AGENTFLOW_GENERATOR] Model Modal Opened:', {
            timestamp: new Date().toISOString()
        })
        setModelModalOpen(true)
    }
    const closeModelModal = () => {
        console.log('🔧 [AGENTFLOW_GENERATOR] Model Modal Closed:', {
            timestamp: new Date().toISOString()
        })
        setModelModalOpen(false)
    }

    // New: Handle model selection from modal
    const handleModelSelect = (newValue) => {
        // Log model selection
        console.log('🤖 [AGENTFLOW_GENERATOR] Model Selected:', {
            model: newValue,
            timestamp: new Date().toISOString()
        })

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
        // Log undo action
        console.log('↩️ [AGENTFLOW_GENERATOR] Undo Action:', {
            flowHistoryLength: flowHistory.length,
            timestamp: new Date().toISOString()
        })

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

    // Render message content based on type
    const renderMessageContent = (message) => {
        if (message.searchResults) {
            return (
                <Box>
                    <Typography variant='body1' sx={{ mb: 2 }}>
                        {message.content}
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {message.searchResults.map((result, index) => (
                            <Card key={index} sx={{ mb: 1, p: 1 }}>
                                <Typography variant='subtitle2' color='primary'>
                                    <a href={result.url} target='_blank' rel='noopener noreferrer'>
                                        {result.title}
                                    </a>
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    {result.snippet}
                                </Typography>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )
        }

        if (message.workflowData) {
            return (
                <Box>
                    <Typography variant='body1' sx={{ mb: 2 }}>
                        {message.content}
                    </Typography>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant='subtitle2'>Workflow Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Typography variant='body2' sx={{ mb: 1 }}>
                                    <strong>Research Results:</strong>
                                </Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    {message.workflowData.researchResults}
                                </Typography>

                                <Typography variant='body2' sx={{ mb: 1 }}>
                                    <strong>Test Results:</strong>
                                </Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    {message.workflowData.testResults?.report || 'Test completed successfully'}
                                </Typography>

                                <Typography variant='body2' sx={{ mb: 1 }}>
                                    <strong>Iterations:</strong> {message.workflowData.iterations}
                                </Typography>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )
        }

        return <Typography variant='body1'>{message.content}</Typography>
    }

    return (
        <Drawer anchor='right' open={open} onClose={onClose} variant='persistent' PaperProps={{ sx: { width: 400 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant='h6' sx={{ flex: 1 }}>
                    Generate Agentflow
                </Typography>
                <IconButton
                    onClick={() => {
                        console.log('❌ [AGENTFLOW_GENERATOR] Panel Closed:', {
                            timestamp: new Date().toISOString()
                        })
                        onClose()
                    }}
                >
                    <IconChevronRight />
                </IconButton>
            </Box>

            {/* AI Assistant Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant='subtitle1' color='primary' sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        🤖 AI Assistant - Ask me anything about your agentflow!
                    </Typography>
                    {modificationHistory.length > 0 && (
                        <Tooltip title='Undo Last Modification'>
                            <IconButton size='small' onClick={handleUndo} disabled={flowHistory.length === 0}>
                                <IconArrowBackUp />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

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
                        <strong>What I can do:</strong>• General chat and questions • Add, update, or delete nodes • Web search and research
                        • Create complete workflows with testing • Modify existing flows
                    </Typography>
                </Box>
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
                                    {renderMessageContent(msg)}
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
                                                                    // Log individual node addition
                                                                    console.log('➕ [AGENTFLOW_GENERATOR] Individual Node Added:', {
                                                                        nodeId: node.id,
                                                                        nodeType: node.type,
                                                                        nodeLabel: node.data?.label,
                                                                        outgoingEdgesCount: Array.isArray(msg.edges)
                                                                            ? msg.edges.filter((e) => e.source === node.id).length
                                                                            : 0,
                                                                        timestamp: new Date().toISOString()
                                                                    })

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
                                                            // Log all nodes addition
                                                            console.log('🎯 [AGENTFLOW_GENERATOR] All Nodes Added:', {
                                                                nodesCount: msg.nodes?.length || 0,
                                                                edgesCount: msg.edges?.length || 0,
                                                                timestamp: new Date().toISOString()
                                                            })

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
                                        // Log Enter key press
                                        console.log('⌨️ [AGENTFLOW_GENERATOR] Enter Key Pressed:', {
                                            message: userMessage,
                                            timestamp: new Date().toISOString()
                                        })
                                        handleSendMessage()
                                    }
                                }}
                                disabled={loading || pendingLLM}
                            />
                            <LoadingButton
                                loading={loading || pendingLLM}
                                variant='contained'
                                onClick={() => {
                                    // Log Send button click
                                    console.log('📤 [AGENTFLOW_GENERATOR] Send Button Clicked:', {
                                        message: userMessage,
                                        timestamp: new Date().toISOString()
                                    })
                                    handleSendMessage()
                                }}
                                disabled={!userMessage.trim() || loading || pendingLLM}
                            >
                                Send
                            </LoadingButton>
                            <Tooltip title={chatType === 'generate' ? 'Generate Agentflow (default)' : 'Switch to Generate Agentflow'}>
                                <IconButton
                                    color={chatType === 'generate' ? 'primary' : 'default'}
                                    onClick={() => {
                                        // Log chat type switch
                                        console.log('🔄 [AGENTFLOW_GENERATOR] Chat Type Switched:', {
                                            from: chatType,
                                            to: 'generate',
                                            timestamp: new Date().toISOString()
                                        })
                                        setChatType('generate')
                                    }}
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
                                    onClick={() => {
                                        // Log chat type switch
                                        console.log('🔄 [AGENTFLOW_GENERATOR] Chat Type Switched:', {
                                            from: chatType,
                                            to: 'talk',
                                            timestamp: new Date().toISOString()
                                        })
                                        setChatType('talk')
                                    }}
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
                {backendLogs.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: '#222', color: '#fff', borderRadius: 2, mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                        <Typography variant='subtitle2' sx={{ color: '#fff', mb: 1 }}>
                            🔍 Backend Processing Logs:
                        </Typography>
                        {backendLogs.map((log, index) => (
                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: '#333', borderRadius: 1 }}>
                                <Typography variant='caption' sx={{ color: '#aaa' }}>
                                    {log.timestamp || new Date().toISOString()}
                                </Typography>
                                <Typography variant='body2' sx={{ color: '#fff', mt: 0.5 }}>
                                    {log.message || log}
                                </Typography>
                            </Box>
                        ))}
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
