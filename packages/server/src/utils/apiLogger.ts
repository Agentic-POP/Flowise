import { Logger } from 'winston'
import { getLogger } from './logger'

export interface APICallLog {
    timestamp: string
    nodeId?: string
    nodeName?: string
    model: string
    input: string
    output: string
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    duration: number
    cost?: number
    sessionId?: string
    flowId?: string
}

export class APILogger {
    private logger: Logger

    constructor() {
        this.logger = getLogger('API_CALLS')
    }

    logAPICall(logData: APICallLog) {
        // Log to console
        console.log('🤖 AI API Call:', {
            timestamp: logData.timestamp,
            model: logData.model,
            nodeId: logData.nodeId,
            nodeName: logData.nodeName,
            inputLength: logData.input.length,
            outputLength: logData.output.length,
            inputTokens: logData.inputTokens,
            outputTokens: logData.outputTokens,
            totalTokens: logData.totalTokens,
            duration: `${logData.duration}ms`,
            cost: logData.cost,
            sessionId: logData.sessionId,
            flowId: logData.flowId
        })

        // Log full details to file
        this.logger.info('AI_API_CALL', {
            ...logData,
            inputPreview: logData.input.substring(0, 200) + (logData.input.length > 200 ? '...' : ''),
            outputPreview: logData.output.substring(0, 200) + (logData.output.length > 200 ? '...' : '')
        })
    }
}

export const apiLogger = new APILogger()
