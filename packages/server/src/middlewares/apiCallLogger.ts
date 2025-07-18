import { Request, Response, NextFunction } from 'express'
import { APILogger, APICallLog } from '../utils/apiLogger'

export class APICallInterceptor {
    private apiLogger: APILogger

    constructor() {
        this.apiLogger = new APILogger()
    }

    // Middleware to intercept and log API calls
    interceptAPICall = (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send
        const startTime = Date.now()

        res.send = function (body: any) {
            const duration = Date.now() - startTime

            // Check if this is an AI model API call
            if (req.path.includes('/prediction') || req.path.includes('/agentflow')) {
                try {
                    const responseData = typeof body === 'string' ? JSON.parse(body) : body

                    // Extract relevant information
                    const logData: Partial<APICallLog> = {
                        timestamp: new Date().toISOString(),
                        input: req.body?.question || req.body?.input || '',
                        output: responseData?.text || responseData?.output || '',
                        duration,
                        sessionId: req.body?.sessionId,
                        flowId: req.body?.chatflowid || req.body?.flowId,
                        nodeId: req.body?.nodeId,
                        model: req.body?.model || 'unknown'
                    }

                    // Try to extract token information if available
                    if (responseData?.tokenUsage) {
                        logData.inputTokens = responseData.tokenUsage.promptTokens
                        logData.outputTokens = responseData.tokenUsage.completionTokens
                        logData.totalTokens = responseData.tokenUsage.totalTokens
                    }

                    this.apiLogger.logAPICall(logData as APICallLog)
                } catch (error) {
                    console.error('Error logging API call:', error)
                }
            }

            return originalSend.call(this, body)
        }.bind(this)

        next()
    }
}
