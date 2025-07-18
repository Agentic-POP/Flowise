/**
 * Robust merge logic for agentflow modifications
 * Handles adding, removing, and modifying nodes/edges while preserving existing flow
 */

export function robustMergeAgentflow({
    existingNodes,
    existingEdges,
    newNodes = [],
    newEdges = [],
    nodesToRemove = [],
    edgesToRemove = [],
    nodesToModify = [],
    edgesToModify = [],
    selectedNodeIds = [],
    duplicateStrategy = 'skip',
    positionOffset = { x: 40, y: 40 }
}) {
    // Step 1: Remove specified nodes and edges
    let resultNodes = existingNodes.filter((n) => !nodesToRemove.includes(n.id))
    let resultEdges = existingEdges.filter((e) => !edgesToRemove.includes(e.id))

    // Step 2: Modify existing nodes and edges
    nodesToModify.forEach((mod) => {
        const index = resultNodes.findIndex((n) => n.id === mod.id)
        if (index !== -1) {
            resultNodes[index] = {
                ...resultNodes[index],
                ...mod.changes,
                highlighted: true
            }
        }
    })

    edgesToModify.forEach((mod) => {
        const index = resultEdges.findIndex((e) => e.id === mod.id)
        if (index !== -1) {
            resultEdges[index] = {
                ...resultEdges[index],
                ...mod.changes,
                highlighted: true
            }
        }
    })

    // Step 3: Add new nodes with ID remapping and positioning
    const existingIds = new Set(resultNodes.map((n) => n.id))
    const idMap = {}

    newNodes.forEach((node) => {
        let newId = node.id
        while (existingIds.has(newId)) {
            newId = generateUniqueId()
        }
        idMap[node.id] = newId

        const positionedNode = {
            ...node,
            id: newId,
            position: findNonOverlappingPosition(node.position, resultNodes, positionOffset),
            highlighted: true
        }

        resultNodes.push(positionedNode)
        existingIds.add(newId)
    })

    // Step 4: Add new edges with remapped IDs
    newEdges.forEach((edge) => {
        const remappedEdge = {
            ...edge,
            id: generateUniqueEdgeId(edge),
            source: idMap[edge.source] || edge.source,
            target: idMap[edge.target] || edge.target,
            highlighted: true
        }

        resultEdges.push(remappedEdge)
    })

    // Step 5: Connect to selected nodes if specified
    if (selectedNodeIds.length && newNodes.length > 0) {
        selectedNodeIds.forEach((selectedId) => {
            const connectionEdge = {
                id: generateUniqueEdgeId({ source: selectedId, target: newNodes[0].id }),
                source: selectedId,
                target: idMap[newNodes[0].id] || newNodes[0].id,
                type: 'agentFlow',
                highlighted: true
            }
            resultEdges.push(connectionEdge)
        })
    }

    return {
        nodes: resultNodes,
        edges: resultEdges,
        highlightedElements: {
            nodes: resultNodes.filter((n) => n.highlighted).map((n) => n.id),
            edges: resultEdges.filter((e) => e.highlighted).map((e) => e.id)
        }
    }
}

function findNonOverlappingPosition(pos, existingNodes, offset) {
    let newPos = { ...pos }
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts && existingNodes.some((n) => distance(n.position, newPos) < 40)) {
        newPos.x += offset.x
        newPos.y += offset.y
        attempts++
    }

    return newPos
}

function distance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}

function generateUniqueId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateUniqueEdgeId(edge) {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Apply cursor modifications to the current flow
 */
export function applyCursorModifications(currentFlow, modifications) {
    try {
        const { nodes: currentNodes, edges: currentEdges } = currentFlow

        // Apply modifications using robust merge logic
        const result = robustMergeAgentflow({
            existingNodes: currentNodes,
            existingEdges: currentEdges,
            newNodes: modifications.nodesToAdd || [],
            newEdges: modifications.edgesToAdd || [],
            nodesToRemove: modifications.nodesToRemove || [],
            edgesToRemove: modifications.edgesToRemove || [],
            nodesToModify: modifications.nodesToModify || [],
            edgesToModify: modifications.edgesToModify || []
        })

        return {
            success: true,
            nodes: result.nodes,
            edges: result.edges,
            highlightedElements: result.highlightedElements
        }
    } catch (error) {
        console.error('Failed to apply modifications:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Highlight modifications for visual feedback
 */
export function highlightModifications(reactFlowInstance, highlightedElements) {
    if (!reactFlowInstance || !highlightedElements) return

    const nodes = reactFlowInstance.getNodes()
    const edges = reactFlowInstance.getEdges()

    // Add highlighting to modified elements
    const updatedNodes = nodes.map((node) => ({
        ...node,
        style: highlightedElements.nodes.includes(node.id)
            ? { ...node.style, border: '2px solid #ff6b6b', boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }
            : node.style
    }))

    const updatedEdges = edges.map((edge) => ({
        ...edge,
        style: highlightedElements.edges.includes(edge.id) ? { ...edge.style, stroke: '#ff6b6b', strokeWidth: 3 } : edge.style
    }))

    reactFlowInstance.setNodes(updatedNodes)
    reactFlowInstance.setEdges(updatedEdges)

    // Remove highlighting after 3 seconds
    setTimeout(() => {
        const finalNodes = reactFlowInstance.getNodes().map((node) => ({
            ...node,
            style: { ...node.style, border: undefined, boxShadow: undefined }
        }))

        const finalEdges = reactFlowInstance.getEdges().map((edge) => ({
            ...edge,
            style: { ...edge.style, stroke: undefined, strokeWidth: undefined }
        }))

        reactFlowInstance.setNodes(finalNodes)
        reactFlowInstance.setEdges(finalEdges)
    }, 3000)
}

/**
 * Validate flow integrity after modifications
 */
export function validateFlowIntegrity(nodes, edges) {
    const issues = []

    // Check for orphaned edges
    const nodeIds = new Set(nodes.map((n) => n.id))
    edges.forEach((edge) => {
        if (!nodeIds.has(edge.source)) {
            issues.push(`Edge ${edge.id} references non-existent source node ${edge.source}`)
        }
        if (!nodeIds.has(edge.target)) {
            issues.push(`Edge ${edge.id} references non-existent target node ${edge.target}`)
        }
    })

    // Check for disconnected nodes
    const connectedNodeIds = new Set()
    edges.forEach((edge) => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
    })

    nodes.forEach((node) => {
        if (!connectedNodeIds.has(node.id)) {
            issues.push(`Node ${node.id} is disconnected from the flow`)
        }
    })

    return {
        isValid: issues.length === 0,
        issues
    }
}
