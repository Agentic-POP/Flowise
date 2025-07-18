import { IReactFlowNode as Node, IReactFlowEdge as Edge } from '../../Interface'
import { FlowAnalysis } from './flowAnalyzer'

export interface Intent {
    action: 'add' | 'remove' | 'modify' | 'connect' | 'reorganize' | 'optimize' | 'debug'
    targetNodes: string[]
    newComponents: Array<{
        type: string
        label: string
        properties?: Record<string, any>
    }>
    placement: {
        strategy: 'after' | 'before' | 'replace' | 'parallel' | 'auto'
        referenceNode?: string
        position?: { x: number; y: number }
    }
    connections: Array<{
        source: string
        target: string
        type?: string
    }>
    confidence: number
    reasoning: string
    priority: 'high' | 'medium' | 'low'
}

export class IntentParser {
    private actionKeywords = {
        add: ['add', 'insert', 'create', 'include', 'add a', 'insert a', 'create a'],
        remove: ['remove', 'delete', 'eliminate', 'take out', 'remove the', 'delete the'],
        modify: ['modify', 'change', 'update', 'edit', 'alter', 'modify the', 'change the'],
        connect: ['connect', 'link', 'join', 'wire', 'connect to', 'link to'],
        reorganize: ['reorganize', 'restructure', 'rearrange', 'reorder', 'move'],
        optimize: ['optimize', 'improve', 'enhance', 'speed up', 'make faster'],
        debug: ['debug', 'fix', 'repair', 'resolve', 'troubleshoot', 'error']
    }

    private nodeTypeKeywords = {
        startAgentflow: ['start', 'beginning', 'entry', 'trigger'],
        llmAgentflow: ['llm', 'language model', 'ai', 'chat', 'gpt', 'openai'],
        toolAgentflow: ['tool', 'function', 'api', 'service', 'utility'],
        conditionAgentflow: ['condition', 'if', 'check', 'decision', 'branch'],
        httpAgentflow: ['http', 'api', 'webhook', 'request', 'call'],
        humanInputAgentflow: ['human', 'user', 'input', 'interaction', 'manual'],
        loopAgentflow: ['loop', 'repeat', 'iterate', 'cycle'],
        endAgentflow: ['end', 'finish', 'complete', 'output', 'result']
    }

    parseIntent(userMessage: string, flowAnalysis: FlowAnalysis): Intent {
        const normalizedMessage = userMessage.toLowerCase().trim()

        const action = this.determineAction(normalizedMessage)
        const targetNodes = this.identifyTargetNodes(normalizedMessage, flowAnalysis)
        const newComponents = this.extractNewComponents(normalizedMessage)
        const placement = this.determinePlacement(normalizedMessage, flowAnalysis, targetNodes)
        const connections = this.determineConnections(normalizedMessage, flowAnalysis, targetNodes)
        const confidence = this.calculateConfidence(normalizedMessage, flowAnalysis)
        const reasoning = this.generateReasoning(action, targetNodes, newComponents, placement)
        const priority = this.determinePriority(normalizedMessage, action)

        return {
            action,
            targetNodes,
            newComponents,
            placement,
            connections,
            confidence,
            reasoning,
            priority
        }
    }

    private determineAction(message: string): Intent['action'] {
        for (const [action, keywords] of Object.entries(this.actionKeywords)) {
            if (keywords.some((keyword) => message.includes(keyword))) {
                return action as Intent['action']
            }
        }

        // Default to add if no clear action is detected
        return 'add'
    }

    private identifyTargetNodes(message: string, flowAnalysis: FlowAnalysis): string[] {
        const targetNodes: string[] = []
        const nodeMap = new Map<string, Node>()

        // Build a map of all nodes by their labels and types
        Object.values(flowAnalysis.nodeTypes)
            .flat()
            .forEach((node) => {
                const label = node.data?.label || node.data?.name || node.type || ''
                nodeMap.set(label.toLowerCase(), node)
                nodeMap.set(node.type?.toLowerCase() || '', node)
                nodeMap.set(node.data?.type?.toLowerCase() || '', node)
            })

        // Look for node references in the message
        for (const [label, node] of nodeMap) {
            if (message.includes(label) && !targetNodes.includes(node.id)) {
                targetNodes.push(node.id)
            }
        }

        // Look for specific node types
        for (const [nodeType, keywords] of Object.entries(this.nodeTypeKeywords)) {
            if (keywords.some((keyword) => message.includes(keyword))) {
                const nodesOfType = flowAnalysis.nodeTypes[nodeType] || []
                nodesOfType.forEach((node) => {
                    if (!targetNodes.includes(node.id)) {
                        targetNodes.push(node.id)
                    }
                })
            }
        }

        return targetNodes
    }

    private extractNewComponents(message: string): Intent['newComponents'] {
        const components: Intent['newComponents'] = []

        // Look for specific node type requests
        for (const [nodeType, keywords] of Object.entries(this.nodeTypeKeywords)) {
            if (keywords.some((keyword) => message.includes(keyword))) {
                const label = this.extractLabel(message, nodeType)
                components.push({
                    type: nodeType,
                    label: label || this.generateDefaultLabel(nodeType),
                    properties: this.extractProperties(message, nodeType)
                })
            }
        }

        // Look for generic component requests
        if (message.includes('node') || message.includes('component')) {
            const genericTypes = ['llmAgentflow', 'toolAgentflow', 'conditionAgentflow']
            genericTypes.forEach((type) => {
                if (!components.some((c) => c.type === type)) {
                    components.push({
                        type,
                        label: this.generateDefaultLabel(type),
                        properties: {}
                    })
                }
            })
        }

        return components
    }

    private extractLabel(message: string, nodeType: string): string {
        // Try to extract a specific label from the message
        const labelPatterns = [
            /(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?([a-zA-Z\s]+?)(?:\s+node|\s+component|$)/i,
            /(?:for|to)\s+([a-zA-Z\s]+?)(?:\s+node|\s+component|$)/i
        ]

        for (const pattern of labelPatterns) {
            const match = message.match(pattern)
            if (match && match[1]) {
                return match[1].trim()
            }
        }

        return ''
    }

    private generateDefaultLabel(nodeType: string): string {
        const labelMap: Record<string, string> = {
            startAgentflow: 'Start',
            llmAgentflow: 'LLM Processing',
            toolAgentflow: 'Tool Execution',
            conditionAgentflow: 'Condition Check',
            httpAgentflow: 'HTTP Request',
            humanInputAgentflow: 'Human Input',
            loopAgentflow: 'Loop',
            endAgentflow: 'End'
        }

        return labelMap[nodeType] || 'New Node'
    }

    private extractProperties(message: string, nodeType: string): Record<string, any> {
        const properties: Record<string, any> = {}

        // Extract common properties based on node type
        if (nodeType === 'llmAgentflow') {
            if (message.includes('gpt')) properties.model = 'gpt'
            if (message.includes('temperature')) {
                const tempMatch = message.match(/temperature\s*[=:]\s*([0-9.]+)/i)
                if (tempMatch) properties.temperature = parseFloat(tempMatch[1])
            }
        }

        if (nodeType === 'httpAgentflow') {
            if (message.includes('get')) properties.method = 'GET'
            if (message.includes('post')) properties.method = 'POST'
            if (message.includes('put')) properties.method = 'PUT'
            if (message.includes('delete')) properties.method = 'DELETE'
        }

        return properties
    }

    private determinePlacement(message: string, flowAnalysis: FlowAnalysis, targetNodes: string[]): Intent['placement'] {
        const placement: Intent['placement'] = {
            strategy: 'auto',
            referenceNode: undefined,
            position: undefined
        }

        // Determine placement strategy
        if (message.includes('after') || message.includes('following')) {
            placement.strategy = 'after'
        } else if (message.includes('before') || message.includes('preceding')) {
            placement.strategy = 'before'
        } else if (message.includes('replace') || message.includes('instead of')) {
            placement.strategy = 'replace'
        } else if (message.includes('parallel') || message.includes('side by side')) {
            placement.strategy = 'parallel'
        }

        // Find reference node
        if (targetNodes.length > 0) {
            placement.referenceNode = targetNodes[0]
        } else if (flowAnalysis.entryPoints.length > 0) {
            placement.referenceNode = flowAnalysis.entryPoints[0].id
        }

        // Extract position hints
        if (message.includes('top') || message.includes('above')) {
            placement.position = { x: 0, y: -100 }
        } else if (message.includes('bottom') || message.includes('below')) {
            placement.position = { x: 0, y: 100 }
        } else if (message.includes('left') || message.includes('before')) {
            placement.position = { x: -200, y: 0 }
        } else if (message.includes('right') || message.includes('after')) {
            placement.position = { x: 200, y: 0 }
        }

        return placement
    }

    private determineConnections(message: string, flowAnalysis: FlowAnalysis, targetNodes: string[]): Intent['connections'] {
        const connections: Intent['connections'] = []

        // If we have target nodes, suggest connections to them
        if (targetNodes.length > 0) {
            const entryPoints = flowAnalysis.entryPoints.map((n) => n.id)
            const exitPoints = flowAnalysis.exitPoints.map((n) => n.id)

            // Connect new nodes to entry points if adding at the beginning
            if (message.includes('start') || message.includes('beginning')) {
                entryPoints.forEach((entryId) => {
                    connections.push({
                        source: entryId,
                        target: 'NEW_NODE_PLACEHOLDER',
                        type: 'agentFlow'
                    })
                })
            }

            // Connect to target nodes if specified
            targetNodes.forEach((targetId) => {
                connections.push({
                    source: 'NEW_NODE_PLACEHOLDER',
                    target: targetId,
                    type: 'agentFlow'
                })
            })
        }

        return connections
    }

    private calculateConfidence(message: string, flowAnalysis: FlowAnalysis): number {
        let confidence = 0.5 // Base confidence

        // Increase confidence based on clear action keywords
        const actionKeywords = Object.values(this.actionKeywords).flat()
        const foundKeywords = actionKeywords.filter((keyword) => message.includes(keyword))
        confidence += foundKeywords.length * 0.1

        // Increase confidence based on specific node type mentions
        const nodeTypeKeywords = Object.values(this.nodeTypeKeywords).flat()
        const foundNodeTypes = nodeTypeKeywords.filter((keyword) => message.includes(keyword))
        confidence += foundNodeTypes.length * 0.05

        // Decrease confidence for ambiguous requests
        if (message.length < 10) confidence -= 0.2
        if (message.includes('maybe') || message.includes('perhaps')) confidence -= 0.1

        // Increase confidence for detailed requests
        if (message.length > 50) confidence += 0.1
        if (message.includes('because') || message.includes('since')) confidence += 0.1

        return Math.min(Math.max(confidence, 0), 1)
    }

    private generateReasoning(
        action: Intent['action'],
        targetNodes: string[],
        newComponents: Intent['newComponents'],
        placement: Intent['placement']
    ): string {
        const parts: string[] = []

        parts.push(`User requested to ${action} components`)

        if (newComponents.length > 0) {
            const componentNames = newComponents.map((c) => c.label).join(', ')
            parts.push(`New components: ${componentNames}`)
        }

        if (targetNodes.length > 0) {
            parts.push(`Targeting ${targetNodes.length} existing node(s)`)
        }

        if (placement.strategy !== 'auto') {
            parts.push(`Placement strategy: ${placement.strategy}`)
        }

        return parts.join('. ')
    }

    private determinePriority(message: string, action: Intent['action']): Intent['priority'] {
        // High priority keywords
        if (message.includes('urgent') || message.includes('critical') || message.includes('error')) {
            return 'high'
        }

        // Low priority keywords
        if (message.includes('maybe') || message.includes('suggestion') || message.includes('optimization')) {
            return 'low'
        }

        // Default based on action
        const highPriorityActions: Intent['action'][] = ['debug', 'fix', 'remove']
        const lowPriorityActions: Intent['action'][] = ['optimize', 'reorganize']

        if (highPriorityActions.includes(action)) return 'high'
        if (lowPriorityActions.includes(action)) return 'low'

        return 'medium'
    }
}
