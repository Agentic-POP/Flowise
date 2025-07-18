import { IReactFlowNode as Node, IReactFlowEdge as Edge } from '../../Interface'
import { FlowAnalysis } from './flowAnalyzer'
import { Intent } from './intentParser'

export interface ModificationSet {
    nodesToAdd: Node[]
    nodesToRemove: string[]
    nodesToModify: Array<{
        id: string
        changes: Partial<Node>
    }>
    edgesToAdd: Edge[]
    edgesToRemove: string[]
    edgesToModify: Array<{
        id: string
        changes: Partial<Edge>
    }>
    highlightedElements: {
        nodes: string[]
        edges: string[]
    }
}

export interface FlowState {
    nodes: Node[]
    edges: Edge[]
}

export class SmartModifier {
    private nodeIdCounter = 0
    private edgeIdCounter = 0

    applyModifications(currentFlow: FlowState, intent: Intent, flowAnalysis: FlowAnalysis): ModificationSet {
        const modifications: ModificationSet = {
            nodesToAdd: [],
            nodesToRemove: [],
            nodesToModify: [],
            edgesToAdd: [],
            edgesToRemove: [],
            edgesToModify: [],
            highlightedElements: {
                nodes: [],
                edges: []
            }
        }

        // Initialize counters based on existing IDs
        this.nodeIdCounter = Math.max(...currentFlow.nodes.map((n) => parseInt(n.id.replace(/\D/g, '')) || 0), 0)
        this.edgeIdCounter = Math.max(...currentFlow.edges.map((e) => parseInt(e.id.replace(/\D/g, '')) || 0), 0)

        switch (intent.action) {
            case 'add':
                this.addNodes(intent, flowAnalysis, modifications)
                break
            case 'remove':
                this.removeNodes(intent, currentFlow, modifications)
                break
            case 'modify':
                this.modifyNodes(intent, currentFlow, modifications)
                break
            case 'connect':
                this.createConnections(intent, currentFlow, modifications)
                break
            case 'reorganize':
                this.reorganizeFlow(intent, currentFlow, modifications)
                break
            case 'optimize':
                this.optimizeFlow(intent, currentFlow, flowAnalysis, modifications)
                break
            case 'debug':
                this.debugFlow(intent, currentFlow, flowAnalysis, modifications)
                break
        }

        return this.validateAndFinalize(currentFlow, modifications)
    }

    private addNodes(intent: Intent, flowAnalysis: FlowAnalysis, modifications: ModificationSet): void {
        intent.newComponents.forEach((component) => {
            const newNode = this.createNode(component, intent.placement)
            modifications.nodesToAdd.push(newNode)

            // Create connections based on intent
            intent.connections.forEach((connection) => {
                const newEdge = this.createEdge(connection, newNode.id)
                if (newEdge) {
                    modifications.edgesToAdd.push(newEdge)
                }
            })
        })
    }

    private createNode(component: Intent['newComponents'][0], placement: Intent['placement']): Node {
        this.nodeIdCounter++
        const nodeId = `node_${this.nodeIdCounter}`

        const baseNode: Node = {
            id: nodeId,
            type: component.type,
            position: this.calculateNodePosition(placement),
            positionAbsolute: this.calculateNodePosition(placement),
            z: 0,
            handleBounds: {
                source: [],
                target: []
            },
            width: 200,
            height: 100,
            selected: false,
            dragging: false,
            data: {
                label: component.label,
                name: component.type,
                type: component.type,
                inputAnchors: [],
                inputParams: [],
                outputAnchors: [],
                ...component.properties
            }
        }

        return baseNode
    }

    private calculateNodePosition(placement: Intent['placement']): { x: number; y: number } {
        if (placement.position) {
            return placement.position
        }

        // Default positioning logic
        const basePosition = { x: 100, y: 100 }

        switch (placement.strategy) {
            case 'after':
                return { x: basePosition.x + 250, y: basePosition.y }
            case 'before':
                return { x: basePosition.x - 250, y: basePosition.y }
            case 'parallel':
                return { x: basePosition.x, y: basePosition.y + 150 }
            default:
                return basePosition
        }
    }

    private createEdge(connection: Intent['connections'][0], newNodeId: string): Edge | null {
        this.edgeIdCounter++
        const edgeId = `edge_${this.edgeIdCounter}`

        // Replace placeholder with actual node ID
        const source = connection.source === 'NEW_NODE_PLACEHOLDER' ? newNodeId : connection.source
        const target = connection.target === 'NEW_NODE_PLACEHOLDER' ? newNodeId : connection.target

        return {
            id: edgeId,
            source,
            sourceHandle: 'output',
            target,
            targetHandle: 'input',
            type: connection.type || 'agentFlow',
            data: {
                label: connection.type || 'agentFlow'
            }
        }
    }

    private removeNodes(intent: Intent, currentFlow: FlowState, modifications: ModificationSet): void {
        intent.targetNodes.forEach((nodeId) => {
            modifications.nodesToRemove.push(nodeId)

            // Remove all edges connected to this node
            currentFlow.edges.forEach((edge) => {
                if (edge.source === nodeId || edge.target === nodeId) {
                    modifications.edgesToRemove.push(edge.id)
                }
            })
        })

        // Reconnect remaining nodes if needed
        this.reconnectAfterRemoval(currentFlow, modifications)
    }

    private reconnectAfterRemoval(currentFlow: FlowState, modifications: ModificationSet): void {
        const removedNodes = new Set(modifications.nodesToRemove)
        const removedEdges = new Set(modifications.edgesToRemove)

        // Find orphaned nodes (nodes that lost their incoming connections)
        const orphanedNodes = currentFlow.nodes.filter((node) => {
            if (removedNodes.has(node.id)) return false

            const hasIncoming = currentFlow.edges.some((edge) => edge.target === node.id && !removedEdges.has(edge.id))
            return !hasIncoming
        })

        // Connect orphaned nodes to entry points or other available nodes
        orphanedNodes.forEach((orphan) => {
            const availableSources = currentFlow.nodes.filter(
                (node) => !removedNodes.has(node.id) && node.id !== orphan.id && !orphanedNodes.some((o) => o.id === node.id)
            )

            if (availableSources.length > 0) {
                const source = availableSources[0]
                const newEdge = this.createEdge(
                    {
                        source: source.id,
                        target: orphan.id,
                        type: 'agentFlow'
                    },
                    orphan.id
                )

                if (newEdge) {
                    modifications.edgesToAdd.push(newEdge)
                }
            }
        })
    }

    private modifyNodes(intent: Intent, currentFlow: FlowState, modifications: ModificationSet): void {
        intent.targetNodes.forEach((nodeId) => {
            const node = currentFlow.nodes.find((n) => n.id === nodeId)
            if (node) {
                const changes: Partial<Node> = {}

                // Apply modifications based on intent
                if (intent.newComponents.length > 0) {
                    const component = intent.newComponents[0]
                    changes.data = {
                        ...node.data,
                        label: component.label,
                        ...component.properties
                    }
                }

                modifications.nodesToModify.push({
                    id: nodeId,
                    changes
                })
            }
        })
    }

    private createConnections(intent: Intent, currentFlow: FlowState, modifications: ModificationSet): void {
        intent.connections.forEach((connection) => {
            // Check if connection already exists
            const existingEdge = currentFlow.edges.find((edge) => edge.source === connection.source && edge.target === connection.target)

            if (!existingEdge) {
                const newEdge = this.createEdge(connection, '')
                if (newEdge) {
                    modifications.edgesToAdd.push(newEdge)
                }
            }
        })
    }

    private reorganizeFlow(intent: Intent, currentFlow: FlowState, modifications: ModificationSet): void {
        // Reorganize node positions for better layout
        const nodes = [...currentFlow.nodes]
        const newPositions = this.calculateOptimalPositions(nodes)

        nodes.forEach((node, index) => {
            if (newPositions[index]) {
                modifications.nodesToModify.push({
                    id: node.id,
                    changes: {
                        position: newPositions[index]
                    }
                })
            }
        })
    }

    private calculateOptimalPositions(nodes: Node[]): Array<{ x: number; y: number }> {
        const positions: Array<{ x: number; y: number }> = []
        const gridSize = 250

        nodes.forEach((node, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3

            positions.push({
                x: col * gridSize + 100,
                y: row * gridSize + 100
            })
        })

        return positions
    }

    private optimizeFlow(intent: Intent, currentFlow: FlowState, flowAnalysis: FlowAnalysis, modifications: ModificationSet): void {
        // Optimize flow based on analysis
        if (flowAnalysis.flowComplexity > 7) {
            // Add condition nodes to reduce complexity
            const conditionNode = this.createNode(
                {
                    type: 'conditionAgentflow',
                    label: 'Optimization Check',
                    properties: {}
                },
                { strategy: 'auto' }
            )

            modifications.nodesToAdd.push(conditionNode)
        }

        // Remove redundant nodes
        const redundantNodes = this.findRedundantNodes(currentFlow, flowAnalysis)
        redundantNodes.forEach((nodeId) => {
            modifications.nodesToRemove.push(nodeId)
        })
    }

    private findRedundantNodes(currentFlow: FlowState, flowAnalysis: FlowAnalysis): string[] {
        const redundant: string[] = []

        // Find nodes with same type and similar properties
        const nodeGroups = new Map<string, Node[]>()
        currentFlow.nodes.forEach((node) => {
            const key = `${node.type}_${node.data?.label || node.data?.name || ''}`
            if (!nodeGroups.has(key)) {
                nodeGroups.set(key, [])
            }
            nodeGroups.get(key)!.push(node)
        })

        nodeGroups.forEach((nodes, key) => {
            if (nodes.length > 1) {
                // Keep the first one, mark others as redundant
                nodes.slice(1).forEach((node) => {
                    redundant.push(node.id)
                })
            }
        })

        return redundant
    }

    private debugFlow(intent: Intent, currentFlow: FlowState, flowAnalysis: FlowAnalysis, modifications: ModificationSet): void {
        // Add debugging nodes
        if (flowAnalysis.disconnectedNodes.length > 0) {
            const debugNode = this.createNode(
                {
                    type: 'conditionAgentflow',
                    label: 'Debug Check',
                    properties: {}
                },
                { strategy: 'auto' }
            )

            modifications.nodesToAdd.push(debugNode)

            // Connect to disconnected nodes
            flowAnalysis.disconnectedNodes.forEach((node) => {
                const edge = this.createEdge(
                    {
                        source: debugNode.id,
                        target: node.id,
                        type: 'agentFlow'
                    },
                    node.id
                )

                if (edge) {
                    modifications.edgesToAdd.push(edge)
                }
            })
        }

        // Add error handling
        if (!flowAnalysis.nodeTypes['conditionAgentflow']) {
            const errorHandler = this.createNode(
                {
                    type: 'conditionAgentflow',
                    label: 'Error Handler',
                    properties: {}
                },
                { strategy: 'auto' }
            )

            modifications.nodesToAdd.push(errorHandler)
        }
    }

    private validateAndFinalize(currentFlow: FlowState, modifications: ModificationSet): ModificationSet {
        // Validate modifications
        const validatedModifications = { ...modifications }

        // Remove invalid node references
        validatedModifications.nodesToRemove = validatedModifications.nodesToRemove.filter((id) =>
            currentFlow.nodes.some((node) => node.id === id)
        )

        validatedModifications.edgesToRemove = validatedModifications.edgesToRemove.filter((id) =>
            currentFlow.edges.some((edge) => edge.id === id)
        )

        // Validate edge modifications
        validatedModifications.edgesToModify = validatedModifications.edgesToModify.filter((mod) =>
            currentFlow.edges.some((edge) => edge.id === mod.id)
        )

        // Track highlighted elements
        validatedModifications.highlightedElements = {
            nodes: [...validatedModifications.nodesToAdd.map((n) => n.id), ...validatedModifications.nodesToModify.map((m) => m.id)],
            edges: [...validatedModifications.edgesToAdd.map((e) => e.id), ...validatedModifications.edgesToModify.map((m) => m.id)]
        }

        return validatedModifications
    }
}
