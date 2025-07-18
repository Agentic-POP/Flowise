import { IReactFlowNode as Node, IReactFlowEdge as Edge } from '../../Interface'

export interface FlowAnalysis {
    entryPoints: Node[]
    exitPoints: Node[]
    criticalPaths: string[][]
    nodeTypes: Record<string, Node[]>
    flowStructure: {
        depth: number
        breadth: number
        complexity: number
        hasLoops: boolean
        hasConditions: boolean
    }
    potentialConnections: Array<{
        source: string
        target: string
        reason: string
    }>
    flowComplexity: number
    disconnectedNodes: Node[]
    orphanedEdges: Edge[]
}

export class FlowAnalyzer {
    analyzeFlow(nodes: Node[], edges: Edge[]): FlowAnalysis {
        const nodeMap = new Map(nodes.map((node) => [node.id, node]))
        const edgeMap = new Map(edges.map((edge) => [edge.id, edge]))

        return {
            entryPoints: this.findEntryPoints(nodes, edges),
            exitPoints: this.findExitPoints(nodes, edges),
            criticalPaths: this.findCriticalPaths(nodes, edges),
            nodeTypes: this.categorizeNodes(nodes),
            flowStructure: this.analyzeFlowStructure(nodes, edges),
            potentialConnections: this.findPotentialConnections(nodes, edges),
            flowComplexity: this.calculateFlowComplexity(nodes, edges),
            disconnectedNodes: this.findDisconnectedNodes(nodes, edges),
            orphanedEdges: this.findOrphanedEdges(nodes, edges)
        }
    }

    private findEntryPoints(nodes: Node[], edges: Edge[]): Node[] {
        const targetNodeIds = new Set(edges.map((edge) => edge.target))
        return nodes.filter((node) => !targetNodeIds.has(node.id))
    }

    private findExitPoints(nodes: Node[], edges: Edge[]): Node[] {
        const sourceNodeIds = new Set(edges.map((edge) => edge.source))
        return nodes.filter((node) => !sourceNodeIds.has(node.id))
    }

    private findCriticalPaths(nodes: Node[], edges: Edge[]): string[][] {
        const entryPoints = this.findEntryPoints(nodes, edges)
        const exitPoints = this.findExitPoints(nodes, edges)
        const paths: string[][] = []

        entryPoints.forEach((entry) => {
            exitPoints.forEach((exit) => {
                const path = this.findPath(entry.id, exit.id, edges)
                if (path.length > 0) {
                    paths.push(path)
                }
            })
        })

        return paths.sort((a, b) => b.length - a.length).slice(0, 5) // Top 5 longest paths
    }

    private findPath(startId: string, endId: string, edges: Edge[]): string[] {
        const graph = new Map<string, string[]>()
        edges.forEach((edge) => {
            if (!graph.has(edge.source)) {
                graph.set(edge.source, [])
            }
            graph.get(edge.source)!.push(edge.target)
        })

        const visited = new Set<string>()
        const path: string[] = []

        const dfs = (currentId: string): boolean => {
            if (currentId === endId) {
                path.push(currentId)
                return true
            }

            if (visited.has(currentId)) return false
            visited.add(currentId)
            path.push(currentId)

            const neighbors = graph.get(currentId) || []
            for (const neighbor of neighbors) {
                if (dfs(neighbor)) {
                    return true
                }
            }

            path.pop()
            return false
        }

        dfs(startId)
        return path
    }

    private categorizeNodes(nodes: Node[]): Record<string, Node[]> {
        const categories: Record<string, Node[]> = {}

        nodes.forEach((node) => {
            const type = node.type || node.data?.type || 'unknown'
            if (!categories[type]) {
                categories[type] = []
            }
            categories[type].push(node)
        })

        return categories
    }

    private analyzeFlowStructure(nodes: Node[], edges: Edge[]): FlowAnalysis['flowStructure'] {
        const nodeMap = new Map(nodes.map((node) => [node.id, node]))
        const graph = new Map<string, string[]>()

        edges.forEach((edge) => {
            if (!graph.has(edge.source)) {
                graph.set(edge.source, [])
            }
            graph.get(edge.source)!.push(edge.target)
        })

        const depth = this.calculateDepth(graph)
        const breadth = this.calculateBreadth(graph)
        const complexity = this.calculateComplexity(nodes, edges)
        const hasLoops = this.detectLoops(graph)
        const hasConditions = this.detectConditions(nodes)

        return {
            depth,
            breadth,
            complexity,
            hasLoops,
            hasConditions
        }
    }

    private calculateDepth(graph: Map<string, string[]>): number {
        const visited = new Set<string>()
        let maxDepth = 0

        const dfs = (nodeId: string, depth: number) => {
            if (visited.has(nodeId)) return
            visited.add(nodeId)
            maxDepth = Math.max(maxDepth, depth)

            const neighbors = graph.get(nodeId) || []
            neighbors.forEach((neighbor) => dfs(neighbor, depth + 1))
        }

        // Start from entry points
        const entryPoints = Array.from(graph.keys()).filter((id) => !Array.from(graph.values()).flat().includes(id))

        entryPoints.forEach((entry) => dfs(entry, 0))
        return maxDepth
    }

    private calculateBreadth(graph: Map<string, string[]>): number {
        let maxBreadth = 0

        graph.forEach((neighbors) => {
            maxBreadth = Math.max(maxBreadth, neighbors.length)
        })

        return maxBreadth
    }

    private calculateComplexity(nodes: Node[], edges: Edge[]): number {
        const nodeCount = nodes.length
        const edgeCount = edges.length
        const maxPossibleEdges = nodeCount * (nodeCount - 1)

        return edgeCount / maxPossibleEdges
    }

    private detectLoops(graph: Map<string, string[]>): boolean {
        const visited = new Set<string>()
        const recStack = new Set<string>()

        const hasCycle = (nodeId: string): boolean => {
            if (recStack.has(nodeId)) return true
            if (visited.has(nodeId)) return false

            visited.add(nodeId)
            recStack.add(nodeId)

            const neighbors = graph.get(nodeId) || []
            for (const neighbor of neighbors) {
                if (hasCycle(neighbor)) return true
            }

            recStack.delete(nodeId)
            return false
        }

        for (const nodeId of graph.keys()) {
            if (hasCycle(nodeId)) return true
        }

        return false
    }

    private detectConditions(nodes: Node[]): boolean {
        return nodes.some(
            (node) =>
                node.type?.includes('condition') ||
                node.data?.type?.includes('condition') ||
                node.data?.label?.toLowerCase().includes('condition')
        )
    }

    private findPotentialConnections(nodes: Node[], edges: Edge[]): Array<{ source: string; target: string; reason: string }> {
        const connections: Array<{ source: string; target: string; reason: string }> = []
        const connectedPairs = new Set(edges.map((edge) => `${edge.source}->${edge.target}`))

        nodes.forEach((source) => {
            nodes.forEach((target) => {
                if (source.id !== target.id && !connectedPairs.has(`${source.id}->${target.id}`)) {
                    const reason = this.analyzeConnectionReason(source, target)
                    if (reason) {
                        connections.push({
                            source: source.id,
                            target: target.id,
                            reason
                        })
                    }
                }
            })
        })

        return connections
    }

    private analyzeConnectionReason(source: Node, target: Node): string | null {
        // Analyze node types and suggest logical connections
        const sourceType = source.type || source.data?.type || source.data?.label || ''
        const targetType = target.type || target.data?.type || target.data?.label || ''

        if (sourceType.toLowerCase().includes('start') && targetType.toLowerCase().includes('llm')) {
            return 'Start node should connect to LLM for processing'
        }

        if (sourceType.toLowerCase().includes('llm') && targetType.toLowerCase().includes('tool')) {
            return 'LLM output can be processed by tools'
        }

        if (sourceType.toLowerCase().includes('tool') && targetType.toLowerCase().includes('end')) {
            return 'Tool results can be sent to end node'
        }

        if (sourceType.toLowerCase().includes('condition') && targetType.toLowerCase().includes('llm')) {
            return 'Conditional logic can route to different LLM nodes'
        }

        return null
    }

    private calculateFlowComplexity(nodes: Node[], edges: Edge[]): number {
        const structure = this.analyzeFlowStructure(nodes, edges)
        const nodeTypes = this.categorizeNodes(nodes)

        let complexity = 0
        complexity += nodes.length * 0.1 // Base complexity per node
        complexity += edges.length * 0.05 // Additional complexity per edge
        complexity += structure.depth * 0.2 // Depth penalty
        complexity += structure.breadth * 0.15 // Breadth penalty
        complexity += Object.keys(nodeTypes).length * 0.1 // Node type diversity
        complexity += structure.hasLoops ? 0.5 : 0 // Loop penalty
        complexity += structure.hasConditions ? 0.3 : 0 // Condition penalty

        return Math.min(complexity, 10) // Cap at 10
    }

    private findDisconnectedNodes(nodes: Node[], edges: Edge[]): Node[] {
        const connectedNodeIds = new Set<string>()

        edges.forEach((edge) => {
            connectedNodeIds.add(edge.source)
            connectedNodeIds.add(edge.target)
        })

        return nodes.filter((node) => !connectedNodeIds.has(node.id))
    }

    private findOrphanedEdges(nodes: Node[], edges: Edge[]): Edge[] {
        const nodeIds = new Set(nodes.map((node) => node.id))

        return edges.filter((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target))
    }
}
