import { useState, useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    IconButton,
    Avatar,
    CircularProgress,
    Alert,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

// icons
import { IconSend, IconBrain, IconMessage, IconWand, IconDownload, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

// project imports
import { useGlobalChat } from '@/store/context/GlobalChatContext'
import useApi from '@/hooks/useApi'
import assistantsApi from '@/api/assistants'
import { baseURL } from '@/store/constant'

// ==============================|| MIDDLE PANEL ||============================== //

const MiddlePanel = ({ onToggleLeft, onToggleRight, leftPanelOpen, rightPanelOpen }) => {
    const theme = useTheme()
    const { currentProject, chatHistory, isGenerating, selectedModel, setSelectedModel, sendMessage, saveProject } = useGlobalChat()

    // State
    const [message, setMessage] = useState('')
    const [modelMenuAnchor, setModelMenuAnchor] = useState(null)
    const [chatModels, setChatModels] = useState([])

    // Refs
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // API
    const getChatModelsApi = useApi(assistantsApi.getChatModels)

    // Load chat models
    useEffect(() => {
        getChatModelsApi.request()
    }, [])

    useEffect(() => {
        if (getChatModelsApi.data) {
            setChatModels(getChatModelsApi.data)

            // Auto-select first model if none selected
            if (!selectedModel && getChatModelsApi.data.length > 0) {
                setSelectedModel(getChatModelsApi.data[0])
            }
        }
    }, [getChatModelsApi.data, selectedModel])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory])

    // Handle send message
    const handleSendMessage = async () => {
        if (!message.trim() || isGenerating) return

        try {
            await sendMessage(message.trim())
            setMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    // Handle enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Handle model selection
    const handleModelSelect = (model) => {
        setSelectedModel(model)
        setModelMenuAnchor(null)
    }

    // Get message type icon
    const getMessageIcon = (messageType) => {
        switch (messageType) {
            case 'user_message':
                return <IconMessage size={16} />
            case 'ai_response':
                return <IconBrain size={16} />
            case 'canvas_update':
                return <IconWand size={16} />
            case 'project_saved':
                return <IconDownload size={16} />
            default:
                return <IconMessage size={16} />
        }
    }

    // Get message type color
    const getMessageColor = (messageType) => {
        switch (messageType) {
            case 'user_message':
                return theme.palette.primary.main
            case 'ai_response':
                return theme.palette.secondary.main
            case 'canvas_update':
                return theme.palette.success.main
            case 'project_saved':
                return theme.palette.info.main
            default:
                return theme.palette.grey[500]
        }
    }

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

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
                    <IconButton onClick={onToggleLeft} size='small'>
                        <IconChevronLeft size={20} />
                    </IconButton>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                            {currentProject?.name || 'No Project Selected'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                            {currentProject?.description || 'Select a project to start chatting'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={onToggleRight} size='small'>
                        <IconChevronRight size={20} />
                    </IconButton>
                </Box>
            </Box>

            {/* Model Selection */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                        Model:
                    </Typography>

                    <Button
                        size='small'
                        variant='outlined'
                        startIcon={<IconBrain size={16} />}
                        onClick={(e) => setModelMenuAnchor(e.currentTarget)}
                        sx={{ minWidth: 120 }}
                    >
                        {selectedModel?.label || 'Select Model'}
                    </Button>

                    <Menu
                        anchorEl={modelMenuAnchor}
                        open={Boolean(modelMenuAnchor)}
                        onClose={() => setModelMenuAnchor(null)}
                        PaperProps={{
                            sx: { minWidth: 200 }
                        }}
                    >
                        {chatModels.map((model) => (
                            <MenuItem
                                key={model.name}
                                onClick={() => handleModelSelect(model)}
                                selected={selectedModel?.name === model.name}
                            >
                                <ListItemIcon>
                                    <Avatar src={`${baseURL}/api/v1/node-icon/${model.name}`} sx={{ width: 24, height: 24 }} />
                                </ListItemIcon>
                                <ListItemText primary={model.label} secondary={model.name} />
                            </MenuItem>
                        ))}
                    </Menu>

                    {currentProject && (
                        <Button
                            size='small'
                            variant='outlined'
                            startIcon={<IconDownload size={16} />}
                            onClick={saveProject}
                            sx={{ ml: 'auto' }}
                        >
                            Save
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {chatHistory.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'center'
                        }}
                    >
                        <IconWand size={48} color={theme.palette.primary.main} />
                        <Typography variant='h6' sx={{ mt: 2, mb: 1 }}>
                            Welcome to FloWise Chat
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                            Start a conversation to build your agent flow. I can help you create, modify, and optimize your projects.
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 400 }}>
                            {[
                                'Create a web search agent that can find information',
                                'Add a document processing node to my flow',
                                'Connect the LLM node to the output node',
                                'Optimize my current flow for better performance'
                            ].map((suggestion, index) => (
                                <Button
                                    key={index}
                                    variant='outlined'
                                    size='small'
                                    onClick={() => setMessage(suggestion)}
                                    sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                >
                                    {suggestion}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {chatHistory.map((msg, index) => (
                            <Paper
                                key={index}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    backgroundColor:
                                        msg.type === 'user_message' ? theme.palette.primary.light + '10' : theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                    <Avatar
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            bgcolor: getMessageColor(msg.type),
                                            fontSize: '12px'
                                        }}
                                    >
                                        {getMessageIcon(msg.type)}
                                    </Avatar>

                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant='caption' sx={{ fontWeight: 600 }}>
                                                {msg.type === 'user_message' ? 'You' : 'FloWise AI'}
                                            </Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                                {formatTimestamp(msg.timestamp)}
                                            </Typography>
                                        </Box>

                                        <Typography variant='body2'>{msg.content}</Typography>

                                        {msg.changes && (
                                            <Box sx={{ mt: 1, p: 1, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                                                <Typography variant='caption' color='text.secondary'>
                                                    Changes applied: {msg.changes.nodes?.length || 0} nodes,{' '}
                                                    {msg.changes.edges?.length || 0} edges
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        ))}

                        {isGenerating && (
                            <Paper elevation={1} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant='body2' color='text.secondary'>
                                        Generating response...
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        <div ref={messagesEndRef} />
                    </Box>
                )}
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        ref={inputRef}
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder='Type your message...'
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isGenerating || !selectedModel}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || isGenerating || !selectedModel}
                                    color='primary'
                                >
                                    <IconSend size={18} />
                                </IconButton>
                            )
                        }}
                    />
                </Box>

                {!selectedModel && (
                    <Alert severity='warning' sx={{ mt: 1 }}>
                        Please select a model to start chatting
                    </Alert>
                )}
            </Box>
        </Box>
    )
}

MiddlePanel.propTypes = {
    onToggleLeft: PropTypes.func.isRequired,
    onToggleRight: PropTypes.func.isRequired,
    leftPanelOpen: PropTypes.bool.isRequired,
    rightPanelOpen: PropTypes.bool.isRequired
}

export default MiddlePanel
