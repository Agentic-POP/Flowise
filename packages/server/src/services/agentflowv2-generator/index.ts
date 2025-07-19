import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import path from 'path'
import * as fs from 'fs'
import { generateAgentflowv2 as generateAgentflowv2_json } from 'flowise-components'
import { z } from 'zod'
import { sysPrompt, cursorPrompt } from './prompt'
import { databaseEntities } from '../../utils'
import logger from '../../utils/logger'
import { MODE } from '../../Interface'
import { FlowState } from './smartModifier'

// Define the Zod schema for Agentflowv2 data structure
const NodeType = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number()
    }),
    width: z.number(),
    height: z.number(),
    selected: z.boolean().optional(),
    positionAbsolute: z
        .object({
            x: z.number(),
            y: z.number()
        })
        .optional(),
    dragging: z.boolean().optional(),
    data: z.any().optional(),
    parentNode: z.string().optional()
})

const EdgeType = z.object({
    source: z.string(),
    sourceHandle: z.string(),
    target: z.string(),
    targetHandle: z.string(),
    data: z
        .object({
            sourceColor: z.string().optional(),
            targetColor: z.string().optional(),
            edgeLabel: z.string().optional(),
            isHumanInput: z.boolean().optional()
        })
        .optional(),
    type: z.string().optional(),
    id: z.string()
})

const AgentFlowV2Type = z
    .object({
        description: z.string().optional(),
        usecases: z.array(z.string()).optional(),
        nodes: z.array(NodeType),
        edges: z.array(EdgeType)
    })
    .describe('Generate Agentflowv2 nodes and edges')

// Type for the templates array
type AgentFlowV2Template = z.infer<typeof AgentFlowV2Type>

const getAllAgentFlow2Nodes = async () => {
    const appServer = getRunningExpressApp()
    const nodes = appServer.nodesPool.componentNodes
    const agentFlow2Nodes = []
    for (const node in nodes) {
        if (nodes[node].category === 'Agent Flows') {
            agentFlow2Nodes.push({
                name: nodes[node].name,
                label: nodes[node].label,
                description: nodes[node].description
            })
        }
    }
    return JSON.stringify(agentFlow2Nodes, null, 2)
}

const getAllToolNodes = async () => {
    const appServer = getRunningExpressApp()
    const nodes = appServer.nodesPool.componentNodes
    const toolNodes = []
    const disabled_nodes = process.env.DISABLED_NODES ? process.env.DISABLED_NODES.split(',') : []
    const removeTools = ['chainTool', 'retrieverTool', 'webBrowser', ...disabled_nodes]

    for (const node in nodes) {
        if (nodes[node].category.includes('Tools')) {
            if (removeTools.includes(nodes[node].name)) {
                continue
            }
            toolNodes.push({
                name: nodes[node].name,
                description: nodes[node].description
            })
        }
    }
    return JSON.stringify(toolNodes, null, 2)
}

const getAllAgentflowv2Marketplaces = async () => {
    const templates: AgentFlowV2Template[] = []
    let marketplaceDir = path.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2')
    let jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path.extname(file) === '.json')
    jsonsInDir.forEach((file) => {
        try {
            const filePath = path.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2', file)
            const fileData = fs.readFileSync(filePath)
            const fileDataObj = JSON.parse(fileData.toString())
            // get rid of the node.data, remain all other properties
            const filteredNodes = fileDataObj.nodes.map((node: any) => {
                return {
                    ...node,
                    data: undefined
                }
            })

            const title = file.split('.json')[0]
            const template = {
                title,
                description: fileDataObj.description || `Template from ${file}`,
                usecases: fileDataObj.usecases || [],
                nodes: filteredNodes,
                edges: fileDataObj.edges
            }

            // Validate template against schema
            const validatedTemplate = AgentFlowV2Type.parse(template)
            templates.push({
                ...validatedTemplate,
                // @ts-ignore
                title: title
            })
        } catch (error) {
            console.error(`Error processing template file ${file}:`, error)
            // Continue with next file instead of failing completely
        }
    })

    // Format templates into the requested string format
    let formattedTemplates = ''
    templates.forEach((template: AgentFlowV2Template, index: number) => {
        formattedTemplates += `Example ${index + 1}: <<${(template as any).title}>> - ${template.description}\n`
        formattedTemplates += `"nodes": [\n`

        // Format nodes with proper indentation
        const nodesJson = JSON.stringify(template.nodes, null, 3)
        // Split by newlines and add 3 spaces to the beginning of each line except the first and last
        const nodesLines = nodesJson.split('\n')
        if (nodesLines.length > 2) {
            formattedTemplates += `   ${nodesLines[0]}\n`
            for (let i = 1; i < nodesLines.length - 1; i++) {
                formattedTemplates += `   ${nodesLines[i]}\n`
            }
            formattedTemplates += `   ${nodesLines[nodesLines.length - 1]}\n`
        } else {
            formattedTemplates += `   ${nodesJson}\n`
        }

        formattedTemplates += `]\n`
        formattedTemplates += `"edges": [\n`

        // Format edges with proper indentation
        const edgesJson = JSON.stringify(template.edges, null, 3)
        // Split by newlines and add tab to the beginning of each line except the first and last
        const edgesLines = edgesJson.split('\n')
        if (edgesLines.length > 2) {
            formattedTemplates += `\t${edgesLines[0]}\n`
            for (let i = 1; i < edgesLines.length - 1; i++) {
                formattedTemplates += `\t${edgesLines[i]}\n`
            }
            formattedTemplates += `\t${edgesLines[edgesLines.length - 1]}\n`
        } else {
            formattedTemplates += `\t${edgesJson}\n`
        }

        formattedTemplates += `]\n\n`
    })

    return formattedTemplates
}

interface FlowModificationRequest {
    question: string
    selectedChatModel: Record<string, any>
    currentNodes?: any[]
    currentEdges?: any[]
    selectedNodeIds?: string[]
    modificationType?: 'add' | 'modify' | 'cursor'
    cursorMode?: boolean
}

const generateAgentflowv2 = async (
    question: string,
    selectedChatModel: Record<string, any>,
    currentFlow?: FlowState,
    cursorMode: boolean = false
) => {
    try {
        logger.info(`[service]: generateAgentflowv2 called. cursorMode=${cursorMode}`)
        logger.info(`[service]: INPUT question: ${question}`)
        logger.info(`[service]: INPUT selectedChatModel: ${JSON.stringify(selectedChatModel)}`)
        const agentFlow2Nodes = await getAllAgentFlow2Nodes()
        const toolNodes = await getAllToolNodes()
        const marketplaceTemplates = await getAllAgentflowv2Marketplaces()

        if (cursorMode && currentFlow) {
            logger.info('[service]: Running in cursor mode')
            // Step 1: Add aiModelCalls array
            const aiModelCalls = []
            // Serialization-safe logging of currentFlow
            try {
                logger.info('[service]: currentFlow keys: ' + Object.keys(currentFlow))
                logger.info(
                    '[service]: currentFlow.nodes keys: ' + (currentFlow.nodes ? currentFlow.nodes.map((n) => n.id).join(',') : 'undefined')
                )
                logger.info(
                    '[service]: currentFlow.edges keys: ' + (currentFlow.edges ? currentFlow.edges.map((e) => e.id).join(',') : 'undefined')
                )
                logger.info('[service]: currentFlow (stringified): ' + JSON.stringify(currentFlow))
            } catch (e) {
                logger.error('[service]: Failed to stringify currentFlow', e)
            }
            // --- LLM-powered cursor mode ---
            const prompt = cursorPrompt
                .replace('{currentFlowState}', JSON.stringify(currentFlow, null, 2))
                .replace('{userRequest}', question)
                .replace('{availableNodes}', agentFlow2Nodes)
                .replace('{marketplaceTemplates}', marketplaceTemplates)
                .replace('{flowAnalysis}', '') // Optionally add flow analysis
            logger.debug('[service]: Cursor mode prompt:', prompt)
            const options: Record<string, any> = {
                appDataSource: getRunningExpressApp().AppDataSource,
                databaseEntities: databaseEntities,
                logger: logger
            }
            let response
            if (process.env.MODE === MODE.QUEUE) {
                const predictionQueue = getRunningExpressApp().queueManager.getQueue('prediction')
                const job = await predictionQueue.addJob({
                    prompt,
                    question,
                    toolNodes,
                    selectedChatModel,
                    isAgentFlowGenerator: true
                })
                logger.debug(`[server]: Generated Agentflowv2 (cursor) Job added to queue: ${job.id}`)
                const queueEvents = predictionQueue.getQueueEvents()
                response = await job.waitUntilFinished(queueEvents)
            } else {
                logger.info('[service]: Calling LLM for cursor mode')
                // Step 1: Log AI model input
                const aiInput = { prompt, selectedChatModel, question }
                response = await generateAgentflowv2_json(
                    { prompt, componentNodes: getRunningExpressApp().nodesPool.componentNodes, toolNodes, selectedChatModel },
                    question,
                    options
                )
                // Step 1: Log AI model output
                aiModelCalls.push({ input: aiInput, output: response })
            }
            logger.info('[service]: LLM response received (cursor mode)')
            logger.info('[service]: LLM response type:', typeof response)
            logger.info('[service]: LLM response is null/undefined:', response === null || response === undefined)

            // Check if the response contains an error
            if (response && typeof response === 'object' && response.error) {
                logger.error('[service]: LLM returned error:', response.error)
                return {
                    success: false,
                    error: response.error,
                    reasoning: 'The AI model encountered an error while processing your request.',
                    aiModelCalls
                }
            }

            // Check if response is null/undefined
            if (!response) {
                logger.error('[service]: LLM returned null/undefined response')
                return {
                    success: false,
                    error: 'No response from AI model',
                    reasoning: 'The AI model did not return a valid response.',
                    aiModelCalls
                }
            }
            // Serialization-safe logging of LLM response
            try {
                logger.info('[service]: LLM response type: ' + typeof response)
                if (response && typeof response === 'object') {
                    logger.info('[service]: LLM response keys: ' + Object.keys(response))
                }
                logger.info('[service]: LLM response (stringified): ' + JSON.stringify(response))
            } catch (e) {
                logger.error('[service]: Failed to stringify LLM response', e)
            }
            // --- Parse LLM response for modifications ---
            try {
                let parsedResponse
                if (typeof response === 'string') {
                    logger.debug('[service]: Parsing LLM string response')
                    parsedResponse = JSON.parse(response)
                    logger.info('[service]: Parsed LLM response (cursor mode):', JSON.stringify(parsedResponse))
                } else if (typeof response === 'object') {
                    parsedResponse = response
                    logger.info('[service]: Parsed LLM response (cursor mode):', JSON.stringify(parsedResponse))
                } else {
                    throw new Error(`Unexpected response type: ${typeof response}`)
                }

                // Apply the same validation logic as generation mode
                // Check if the response contains complete nodes/edges (like generation mode)
                if (parsedResponse.nodes && parsedResponse.edges) {
                    // This is a complete flow response, validate it like generation mode
                    const validatedResponse = AgentFlowV2Type.parse(parsedResponse)
                    logger.info('[service]: Cursor mode - Complete flow validated:', JSON.stringify(validatedResponse, null, 2))
                    return { ...validatedResponse, aiModelCalls }
                } else if (parsedResponse.modifications) {
                    // This is a modifications response (original cursor mode format)
                    logger.info('[service]: Cursor mode - Modifications format:', JSON.stringify(parsedResponse, null, 2))
                    return { ...parsedResponse, aiModelCalls }
                } else {
                    // Try to extract nodes/edges from the response if they exist in a different format
                    const extractedResponse = extractNodesAndEdges(parsedResponse)
                    if (extractedResponse.nodes && extractedResponse.edges) {
                        const validatedResponse = AgentFlowV2Type.parse(extractedResponse)
                        logger.info('[service]: Cursor mode - Extracted and validated flow:', JSON.stringify(validatedResponse, null, 2))
                        return { ...validatedResponse, aiModelCalls }
                    }

                    // If we can't extract a valid flow, create a fallback response
                    logger.warn('[service]: Cursor mode - Could not extract valid flow, creating fallback response')
                    logger.warn('[service]: Cursor mode - Original parsed response:', JSON.stringify(parsedResponse, null, 2))

                    // Return a structured response that the frontend can handle
                    return {
                        success: false,
                        error: 'AI response format not recognized',
                        reasoning: 'The AI response could not be processed. Please try rephrasing your request.',
                        rawResponse: parsedResponse,
                        aiModelCalls
                    }
                }
            } catch (parseError) {
                logger.error('[service]: Failed to parse or validate LLM response:', parseError)
                return {
                    error: 'Failed to validate LLM response format',
                    rawResponse: response,
                    aiModelCalls
                } as any
            }
        } else {
            // ...existing generation mode...
            logger.info('[service]: Running in generation mode for new flow')
            logger.info('[service]: Generation mode INPUT:', JSON.stringify({ question, selectedChatModel }, null, 2))
            const prompt = sysPrompt
                .replace('{agentFlow2Nodes}', agentFlow2Nodes)
                .replace('{marketplaceTemplates}', marketplaceTemplates)
                .replace('{userRequest}', question)
            logger.debug('[service]: Generation mode prompt:', prompt)
            const options: Record<string, any> = {
                appDataSource: getRunningExpressApp().AppDataSource,
                databaseEntities: databaseEntities,
                logger: logger
            }
            let response
            if (process.env.MODE === MODE.QUEUE) {
                const predictionQueue = getRunningExpressApp().queueManager.getQueue('prediction')
                const job = await predictionQueue.addJob({
                    prompt,
                    question,
                    toolNodes,
                    selectedChatModel,
                    isAgentFlowGenerator: true
                })
                logger.debug(`[server]: Generated Agentflowv2 Job added to queue: ${job.id}`)
                const queueEvents = predictionQueue.getQueueEvents()
                response = await job.waitUntilFinished(queueEvents)
            } else {
                logger.info('[service]: Calling LLM for generation mode')
                response = await generateAgentflowv2_json(
                    { prompt, componentNodes: getRunningExpressApp().nodesPool.componentNodes, toolNodes, selectedChatModel },
                    question,
                    options
                )
            }
            logger.info('[service]: LLM response received (generation mode)')
            logger.info('[service]: LLM response type:', typeof response)
            logger.info('[service]: LLM response is null/undefined:', response === null || response === undefined)

            // Check if the response contains an error
            if (response && typeof response === 'object' && response.error) {
                logger.error('[service]: LLM returned error:', response.error)
                return {
                    success: false,
                    error: response.error,
                    reasoning: 'The AI model encountered an error while processing your request.'
                }
            }

            // Check if response is null/undefined
            if (!response) {
                logger.error('[service]: LLM returned null/undefined response')
                return {
                    success: false,
                    error: 'No response from AI model',
                    reasoning: 'The AI model did not return a valid response.'
                }
            }
            try {
                if (typeof response === 'string') {
                    logger.debug('[service]: Parsing LLM string response (generation mode)')
                    const parsedResponse = JSON.parse(response)
                    const validatedResponse = AgentFlowV2Type.parse(parsedResponse)
                    logger.info('[service]: Generation mode OUTPUT:', JSON.stringify(validatedResponse, null, 2))
                    return validatedResponse
                } else if (typeof response === 'object') {
                    const validatedResponse = AgentFlowV2Type.parse(response)
                    logger.info('[service]: Generation mode OUTPUT:', JSON.stringify(validatedResponse, null, 2))
                    return validatedResponse
                } else {
                    throw new Error(`Unexpected response type: ${typeof response}`)
                }
            } catch (parseError) {
                logger.error('[service]: Failed to parse or validate response:', parseError)
                logger.error('[service]: Generation mode ERROR INPUT:', JSON.stringify({ question, selectedChatModel }, null, 2))
                logger.error('[service]: Generation mode ERROR OUTPUT:', response)
                return {
                    error: 'Failed to validate response format',
                    rawResponse: response
                } as any
            }
        }
    } catch (error) {
        logger.error('[service]: FATAL ERROR:', error)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: generateAgentflowv2 - ${getErrorMessage(error)}`)
    }
}

// Helper function to extract nodes and edges from various response formats
const extractNodesAndEdges = (response: any) => {
    // Try different possible locations for nodes and edges
    if (response.nodes && response.edges) {
        return response
    }

    // Check if nodes/edges are nested in a different structure
    if (response.result && response.result.nodes && response.result.edges) {
        return response.result
    }

    if (response.data && response.data.nodes && response.data.edges) {
        return response.data
    }

    if (response.workflow && response.workflow.nodes && response.workflow.edges) {
        return response.workflow
    }

    // If we can't find nodes/edges, return the original response
    return response
}

export default {
    generateAgentflowv2
}
