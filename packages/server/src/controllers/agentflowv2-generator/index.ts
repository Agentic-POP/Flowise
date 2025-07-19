import { Request, Response, NextFunction } from 'express'
import agentflowv2Service from '../../services/agentflowv2-generator'
import logger from '../../utils/logger'

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
    generateAgentflowv2
}
