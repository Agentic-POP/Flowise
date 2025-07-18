import { Request, Response, NextFunction } from 'express'
import agentflowv2Service from '../../services/agentflowv2-generator'
import logger from '../../utils/logger'

const generateAgentflowv2 = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Controller hit', req.body)
        logger.info(`Agentflow send button clicked${req.body.question ? ': ' + req.body.question : ''}`)

        const { question, selectedChatModel, currentFlow, cursorMode } = req.body

        if (!question || !selectedChatModel) {
            throw new Error('Question and selectedChatModel are required')
        }

        // Handle cursor mode with current flow
        if (cursorMode && currentFlow) {
            logger.info('[controller]: Processing cursor mode request')
            logger.info('[controller]: Current flow nodes:', currentFlow.nodes?.length || 0)
            logger.info('[controller]: Current flow edges:', currentFlow.edges?.length || 0)

            try {
                const apiResponse = await agentflowv2Service.generateAgentflowv2(
                    question,
                    selectedChatModel,
                    currentFlow,
                    true // cursorMode
                )
                logger.info('[controller]: Cursor mode response:', apiResponse)
                return res.json(apiResponse)
            } catch (cursorError) {
                logger.error('[controller]: Cursor mode error:', cursorError)
                return res.status(500).json({
                    error: 'Cursor mode processing failed',
                    details: cursorError.message
                })
            }
        } else {
            // Original generation mode
            logger.info('[controller]: Processing generation mode request')
            const apiResponse = await agentflowv2Service.generateAgentflowv2(question, selectedChatModel)
            return res.json(apiResponse)
        }
    } catch (error) {
        logger.error('[controller]: General error:', error)
        next(error)
    }
}

export default {
    generateAgentflowv2
}
