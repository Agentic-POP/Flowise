import { useState, useCallback, useRef } from 'react'
import { cloneDeep, isEqual } from 'lodash'

// Constants
const MAX_HISTORY_ENTRIES = 100
const MAX_HISTORY_SIZE_MB = 50
const RAPID_SUCCESSION_THRESHOLD = 1000 // ms

// Enhanced history entry structure
const createHistoryEntry = (type, nodes, edges, changes, metadata = {}) => ({
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    nodes: cloneDeep(nodes),
    edges: cloneDeep(edges),
    changes: cloneDeep(changes),
    metadata: {
        timestamp: new Date().toISOString(),
        user: 'current_user', // TODO: Get from auth context
        session: sessionStorage.getItem('sessionId') || 'default',
        intent: metadata.intent || 'manual_operation',
        source: metadata.source || 'manual',
        description: metadata.description || 'Canvas updated',
        ...metadata
    },
    context: {
        selectedNodes: metadata.selectedNodes || [],
        cursorPosition: metadata.cursorPosition || { x: 0, y: 0 },
        zoom: metadata.zoom || 1.0,
        viewport: metadata.viewport || { x: 0, y: 0, zoom: 1.0 }
    }
})

// Smart change detection
const hasSignificantChanges = (oldState, newState) => {
    if (!oldState || !newState) return { hasChanges: true, changes: {} }

    const oldNodes = oldState.nodes || []
    const newNodes = newState.nodes || []
    const oldEdges = oldState.edges || []
    const newEdges = newState.edges || []

    // Compare nodes
    const nodeChanges = compareNodes(oldNodes, newNodes)
    const edgeChanges = compareEdges(oldEdges, newEdges)

    return {
        hasChanges: nodeChanges.hasChanges || edgeChanges.hasChanges,
        changes: {
            nodes: nodeChanges,
            edges: edgeChanges
        }
    }
}

const compareNodes = (oldNodes, newNodes) => {
    const addedNodes = newNodes.filter((newNode) => !oldNodes.find((oldNode) => oldNode.id === newNode.id))

    const removedNodes = oldNodes.filter((oldNode) => !newNodes.find((newNode) => newNode.id === oldNode.id))

    const modifiedNodes = newNodes.filter((newNode) => {
        const oldNode = oldNodes.find((n) => n.id === newNode.id)
        return oldNode && !isEqual(oldNode, newNode)
    })

    return {
        hasChanges: addedNodes.length > 0 || removedNodes.length > 0 || modifiedNodes.length > 0,
        addedNodes,
        removedNodes,
        modifiedNodes
    }
}

const compareEdges = (oldEdges, newEdges) => {
    const addedEdges = newEdges.filter((newEdge) => !oldEdges.find((oldEdge) => oldEdge.id === newEdge.id))

    const removedEdges = oldEdges.filter((oldEdge) => !newEdges.find((newEdge) => newEdge.id === oldEdge.id))

    const modifiedEdges = newEdges.filter((newEdge) => {
        const oldEdge = oldEdges.find((e) => e.id === newEdge.id)
        return oldEdge && !isEqual(oldEdge, newEdge)
    })

    return {
        hasChanges: addedEdges.length > 0 || removedEdges.length > 0 || modifiedEdges.length > 0,
        addedEdges,
        removedEdges,
        modifiedEdges
    }
}

// Operation grouping
const shouldGroupWithPrevious = (currentOp, currentGroup) => {
    if (!currentGroup || currentGroup.operations.length === 0) return false

    const lastOp = currentGroup.operations[currentGroup.operations.length - 1]
    const timeDiff = new Date(currentOp.metadata.timestamp) - new Date(lastOp.metadata.timestamp)

    // Group operations that happen within 2 seconds of each other
    if (timeDiff > 2000) return false

    // Group similar operations
    const similarTypes = ['add_nodes', 'delete_nodes', 'modify_nodes']
    if (similarTypes.includes(currentOp.type) && similarTypes.includes(lastOp.type)) {
        return true
    }

    return false
}

const mergeChanges = (existingChanges, newChanges) => {
    return {
        nodes: {
            addedNodes: [...(existingChanges.nodes?.addedNodes || []), ...(newChanges.nodes?.addedNodes || [])],
            removedNodes: [...(existingChanges.nodes?.removedNodes || []), ...(newChanges.nodes?.removedNodes || [])],
            modifiedNodes: [...(existingChanges.nodes?.modifiedNodes || []), ...(newChanges.nodes?.modifiedNodes || [])]
        },
        edges: {
            addedEdges: [...(existingChanges.edges?.addedEdges || []), ...(newChanges.edges?.addedEdges || [])],
            removedEdges: [...(existingChanges.edges?.removedEdges || []), ...(newChanges.edges?.removedEdges || [])],
            modifiedEdges: [...(existingChanges.edges?.modifiedEdges || []), ...(newChanges.edges?.modifiedEdges || [])]
        }
    }
}

const generateGroupDescription = (operations) => {
    const types = operations.map((op) => op.type)
    const uniqueTypes = [...new Set(types)]

    if (uniqueTypes.length === 1) {
        const type = uniqueTypes[0]
        const count = operations.length
        switch (type) {
            case 'add_nodes':
                return `Added ${count} node${count > 1 ? 's' : ''}`
            case 'delete_nodes':
                return `Deleted ${count} node${count > 1 ? 's' : ''}`
            case 'modify_nodes':
                return `Modified ${count} node${count > 1 ? 's' : ''}`
            case 'connect_edges':
                return `Connected ${count} edge${count > 1 ? 's' : ''}`
            default:
                return `${type} (${count} operations)`
        }
    }

    return `Multiple operations (${operations.length})`
}

// History cleanup
const cleanupHistory = (history) => {
    let cleanedHistory = [...history]

    // Remove old entries if we exceed limits
    if (cleanedHistory.length > MAX_HISTORY_ENTRIES) {
        const toRemove = cleanedHistory.length - MAX_HISTORY_ENTRIES
        cleanedHistory.splice(0, toRemove)
    }

    // Check memory usage
    const historySize = JSON.stringify(cleanedHistory).length / 1024 / 1024 // MB
    if (historySize > MAX_HISTORY_SIZE_MB) {
        // Remove oldest entries until under limit
        while (historySize > MAX_HISTORY_SIZE_MB && cleanedHistory.length > 10) {
            cleanedHistory.shift()
        }
    }

    return cleanedHistory
}

// Enhanced history hook
export const useEnhancedHistory = () => {
    const [history, setHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [pendingGroup, setPendingGroup] = useState(null)
    const lastOperationTime = useRef(0)
    const rapidSuccessionTimeout = useRef(null)

    // Check if operation should create history entry
    const shouldCreateHistoryEntry = useCallback((oldState, newState, operation = {}) => {
        const changes = hasSignificantChanges(oldState, newState)

        // Don't create history if no meaningful changes
        if (!changes.hasChanges) return false

        // Don't create history for temporary operations
        if (operation.isTemporary) return false

        // Check for rapid succession
        const now = Date.now()
        const isRapidSuccession = now - lastOperationTime.current < RAPID_SUCCESSION_THRESHOLD
        lastOperationTime.current = now

        if (isRapidSuccession && operation.type !== 'load_flow') {
            // Delay the history entry to see if more operations follow
            clearTimeout(rapidSuccessionTimeout.current)
            rapidSuccessionTimeout.current = setTimeout(() => {
                // This will be handled by the next operation
            }, RAPID_SUCCESSION_THRESHOLD)
            return false
        }

        return true
    }, [])

    // Add entry to history
    const addHistoryEntry = useCallback(
        (type, nodes, edges, changes, metadata = {}) => {
            const entry = createHistoryEntry(type, nodes, edges, changes, metadata)

            setHistory((prevHistory) => {
                let newHistory = [...prevHistory]

                // Remove any future history if we're not at the end
                if (historyIndex < newHistory.length - 1) {
                    newHistory = newHistory.slice(0, historyIndex + 1)
                }

                // Add new entry
                newHistory.push(entry)

                // Clean up history
                newHistory = cleanupHistory(newHistory)

                return newHistory
            })

            setHistoryIndex((prev) => prev + 1)
        },
        [historyIndex]
    )

    // Group related operations
    const groupRelatedOperations = useCallback((newEntry) => {
        setHistory((prevHistory) => {
            if (prevHistory.length === 0) {
                return [newEntry]
            }

            const lastEntry = prevHistory[prevHistory.length - 1]

            if (shouldGroupWithPrevious(newEntry, { operations: [lastEntry] })) {
                // Create a grouped entry
                const groupedEntry = {
                    ...newEntry,
                    type: 'grouped_operation',
                    operations: [lastEntry, newEntry],
                    changes: mergeChanges(lastEntry.changes, newEntry.changes),
                    metadata: {
                        ...newEntry.metadata,
                        description: generateGroupDescription([lastEntry, newEntry])
                    }
                }

                // Replace the last entry with the grouped entry
                const newHistory = [...prevHistory.slice(0, -1), groupedEntry]
                return cleanupHistory(newHistory)
            } else {
                // Add as separate entry
                const newHistory = [...prevHistory, newEntry]
                return cleanupHistory(newHistory)
            }
        })
    }, [])

    // Smart history push
    const pushHistory = useCallback(
        (type, nodes, edges, oldState, metadata = {}) => {
            const changes = hasSignificantChanges(oldState, { nodes, edges })

            if (!shouldCreateHistoryEntry(oldState, { nodes, edges }, { type })) {
                return
            }

            // Capture current context
            const currentContext = {
                selectedNodes: metadata.selectedNodes || [],
                cursorPosition: metadata.cursorPosition || { x: 0, y: 0 },
                zoom: metadata.zoom || 1.0,
                viewport: metadata.viewport || { x: 0, y: 0, zoom: 1.0 },
                timestamp: Date.now(),
                session: sessionStorage.getItem('sessionId') || 'default'
            }

            const entry = createHistoryEntry(type, nodes, edges, changes, {
                ...metadata,
                context: currentContext
            })

            groupRelatedOperations(entry)
            setHistoryIndex((prev) => prev + 1)
        },
        [shouldCreateHistoryEntry, groupRelatedOperations]
    )

    // Restore context when navigating history
    const restoreContext = useCallback((entry) => {
        if (entry.context) {
            // Restore viewport if available
            if (entry.context.viewport) {
                // This would need to be implemented in the canvas component
                // to actually restore the viewport state
                console.log('Restoring viewport:', entry.context.viewport)
            }

            // Restore selected nodes if available
            if (entry.context.selectedNodes) {
                console.log('Restoring selected nodes:', entry.context.selectedNodes)
            }
        }
    }, [])

    // Enhanced undo with context restoration
    const undoWithContext = useCallback(() => {
        if (historyIndex > 0) {
            const previousState = history[historyIndex - 1]
            setHistoryIndex((prev) => prev - 1)
            restoreContext(previousState)
            return previousState
        }
        return null
    }, [history, historyIndex, restoreContext])

    // Enhanced redo with context restoration
    const redoWithContext = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1]
            setHistoryIndex((prev) => prev + 1)
            restoreContext(nextState)
            return nextState
        }
        return null
    }, [history, historyIndex, restoreContext])

    // Clear history
    const clearHistory = useCallback(() => {
        setHistory([])
        setHistoryIndex(-1)
        setPendingGroup(null)
    }, [])

    // Get current state
    const getCurrentState = useCallback(() => {
        if (historyIndex >= 0 && historyIndex < history.length) {
            return history[historyIndex]
        }
        return null
    }, [history, historyIndex])

    // Analytics and statistics
    const getHistoryStats = useCallback(() => {
        if (history.length === 0) {
            return {
                totalEntries: 0,
                totalNodes: 0,
                totalEdges: 0,
                operationTypes: {},
                timeSpans: {},
                mostActivePeriod: null
            }
        }

        const stats = {
            totalEntries: history.length,
            totalNodes: 0,
            totalEdges: 0,
            operationTypes: {},
            timeSpans: {},
            mostActivePeriod: null
        }

        // Analyze operation types
        history.forEach((entry) => {
            stats.operationTypes[entry.type] = (stats.operationTypes[entry.type] || 0) + 1

            // Count total nodes and edges
            stats.totalNodes += entry.nodes.length
            stats.totalEdges += entry.edges.length
        })

        // Analyze time patterns
        const timeGroups = {}
        history.forEach((entry) => {
            const date = new Date(entry.metadata.timestamp)
            const hour = date.getHours()
            const dayOfWeek = date.getDay()

            timeGroups[hour] = (timeGroups[hour] || 0) + 1
            timeGroups[`day_${dayOfWeek}`] = (timeGroups[`day_${dayOfWeek}`] || 0) + 1
        })

        stats.timeSpans = timeGroups

        // Find most active period
        const mostActiveHour = Object.entries(timeGroups)
            .filter(([key]) => !key.startsWith('day_'))
            .sort(([, a], [, b]) => b - a)[0]

        if (mostActiveHour) {
            stats.mostActivePeriod = `${mostActiveHour[0]}:00`
        }

        return stats
    }, [history])

    // Get operation frequency
    const getOperationFrequency = useCallback(() => {
        const frequency = {}
        history.forEach((entry) => {
            frequency[entry.type] = (frequency[entry.type] || 0) + 1
        })
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => ({ type, count, percentage: ((count / history.length) * 100).toFixed(1) }))
    }, [history])

    // Get recent activity
    const getRecentActivity = useCallback(
        (hours = 24) => {
            const cutoff = Date.now() - hours * 60 * 60 * 1000
            return history.filter((entry) => new Date(entry.metadata.timestamp).getTime() > cutoff)
        },
        [history]
    )

    // Get session summary
    const getSessionSummary = useCallback(() => {
        const sessions = {}
        history.forEach((entry) => {
            const session = entry.metadata.session || 'default'
            if (!sessions[session]) {
                sessions[session] = {
                    count: 0,
                    firstEntry: entry,
                    lastEntry: entry,
                    operations: {}
                }
            }
            sessions[session].count++
            sessions[session].lastEntry = entry
            sessions[session].operations[entry.type] = (sessions[session].operations[entry.type] || 0) + 1
        })
        return sessions
    }, [history])

    // Check if can undo/redo
    const canUndo = historyIndex > 0
    const canRedo = historyIndex < history.length - 1

    return {
        history,
        historyIndex,
        canUndo,
        canRedo,
        pushHistory,
        undo: undoWithContext,
        redo: redoWithContext,
        clearHistory,
        getCurrentState,
        addHistoryEntry,
        shouldCreateHistoryEntry,
        getHistoryStats,
        getOperationFrequency,
        getRecentActivity,
        getSessionSummary
    }
}
