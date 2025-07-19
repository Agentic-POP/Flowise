import { Request, Response, NextFunction } from 'express'
import agentflowv2Service from '../../services/agentflowv2-generator'
import logger from '../../utils/logger'
import { processUserMessageWithAI } from '../../services/agentflowv2-generator'

// Remove processUserMessageWithAI and helper functions from this file.

// All the old handler functions are now replaced by the single AI model call
// The AI model handles all response types internally based on context

// The complete workflow functionality is now handled by the single AI model call
// The AI model can determine when to create complete workflows based on user intent

// Helper functions for complete workflow
// All helper functions are now handled by the single AI model call
// The AI model has access to all context and can perform any needed operations

// All helper functions are now handled by the single AI model call
// The AI model has access to all context and can perform any needed operations

// Main conversational request handler - simplified with single AI call
const processConversationalRequest = async (req: Request, res: Response, next: NextFunction) => {
    const debugLogs: string[] = []
    try {
        console.log('Conversational controller hit', req.body)
        logger.info(`[conversational-controller]: Request received. Body: ${JSON.stringify(req.body)}`)
        debugLogs.push('[conversational-controller]: Request received. Body keys: ' + Object.keys(req.body))

        const { message, sessionId, currentFlow, selectedChatModel } = req.body

        if (!message || !selectedChatModel) {
            logger.error('[conversational-controller]: Missing message or selectedChatModel')
            debugLogs.push('[conversational-controller]: Missing message or selectedChatModel')
            return res.status(400).json({ error: 'Message and selectedChatModel are required', debugLogs })
        }

        // Single AI model call with full context
        logger.info(`[conversational-controller]: Processing message with AI: "${message}"`)
        debugLogs.push(`[conversational-controller]: Processing message with AI: "${message}"`)

        const response = await processUserMessageWithAI(message, currentFlow, selectedChatModel)

        logger.info(`[conversational-controller]: AI response: ${JSON.stringify(response)}`)
        debugLogs.push(`[conversational-controller]: AI response type: ${response.type}`)

        // Return response with debug logs
        const responseToSend = { ...response, debugLogs }
        return res.json(responseToSend)
    } catch (error) {
        logger.error('[conversational-controller]: General error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        debugLogs.push('[conversational-controller]: General error: ' + errorMessage)
        return res.status(500).json({
            error: 'Conversational processing failed',
            details: errorMessage,
            debugLogs
        })
    }
}

// Keep the original function for backward compatibility
const generateAgentflowv2 = async (req: Request, res: Response, next: NextFunction) => {
    const debugLogs: string[] = []
    try {
        console.log('Controller hit', req.body)
        logger.info(`[controller]: Request received. Body: ${JSON.stringify(req.body)}`)
        debugLogs.push('[controller]: Request received. Body keys: ' + Object.keys(req.body))
        logger.info(`Agentflow send button clicked${req.body.question ? ': ' + req.body.question : ''}`)
        debugLogs.push('[controller]: Agentflow send button clicked' + (req.body.question ? ': ' + req.body.question : ''))

        const { question, selectedChatModel, currentFlow, cursorMode } = req.body

        if (!question || !selectedChatModel) {
            logger.error('[controller]: Missing question or selectedChatModel')
            debugLogs.push('[controller]: Missing question or selectedChatModel')
            return res.status(400).json({ error: 'Question and selectedChatModel are required', debugLogs })
        }

        // Handle cursor mode with current flow
        if (cursorMode && currentFlow) {
            // TEST: Always add a test debug log for cursor mode
            debugLogs.push('[controller]: TEST - cursor mode debug log reached')
            try {
                const apiResponse = await agentflowv2Service.generateAgentflowv2(
                    question,
                    selectedChatModel,
                    currentFlow,
                    true // cursorMode
                )
                // Attach input and output for debugging
                const debugData = {
                    input: {
                        question,
                        selectedChatModel,
                        currentFlow
                    },
                    output: apiResponse
                }
                // Always include debugData in the response
                let responseToSend
                if (apiResponse && typeof apiResponse === 'object' && !Array.isArray(apiResponse)) {
                    responseToSend = { ...apiResponse, debugData, debugLogs: [...(apiResponse.debugLogs || []), ...debugLogs] }
                } else {
                    responseToSend = { result: apiResponse, debugData, debugLogs }
                }
                return res.json(responseToSend)
            } catch (cursorError) {
                const errorMessage = cursorError instanceof Error ? cursorError.message : String(cursorError)
                debugLogs.push('[controller]: TEST - cursor mode error: ' + errorMessage)
                return res.status(500).json({
                    error: 'Cursor mode processing failed',
                    details: errorMessage,
                    debugLogs
                })
            }
        } else {
            // Original generation mode
            logger.info('[controller]: Processing generation mode request')
            debugLogs.push('[controller]: Processing generation mode request')
            logger.info(`[controller]: Calling service with cursorMode=false`)
            debugLogs.push('[controller]: Calling service with cursorMode=false')
            const apiResponse = await agentflowv2Service.generateAgentflowv2(question, selectedChatModel)
            logger.info('[controller]: Generation mode response:', JSON.stringify(apiResponse))
            debugLogs.push('[controller]: Generation mode response')
            if (apiResponse && typeof apiResponse === 'object') {
                apiResponse.debugLogs = [...(apiResponse.debugLogs || []), ...debugLogs]
            }
            return res.json(apiResponse)
        }
    } catch (error) {
        logger.error('[controller]: General error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        debugLogs.push('[controller]: General error: ' + errorMessage)
        next(error)
    }
}

export default {
    generateAgentflowv2,
    processConversationalRequest
}
