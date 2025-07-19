import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import {
    Modal,
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// icons
import {
    IconHistory,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconTrash,
    IconEye,
    IconX,
    IconChevronDown,
    IconPlus,
    IconMinus,
    IconEdit,
    IconTimeline,
    IconList,
    IconTrendingUp
} from '@tabler/icons-react'

// project imports
import HistoryTimeline from '@/ui-component/timeline/HistoryTimeline'
import HistoryAnalytics from '@/ui-component/analytics/HistoryAnalytics'

// ==============================|| ENHANCED HISTORY MODAL ||============================== //

const EnhancedHistoryModal = ({ open, onClose, history, historyIndex, onUndo, onRedo, onRestore, onClearHistory }) => {
    const theme = useTheme()
    const [diffDialogOpen, setDiffDialogOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [activeTab, setActiveTab] = useState(0)

    // Calculate analytics data
    const historyStats = {
        totalEntries: history.length,
        totalNodes: history.reduce((sum, entry) => sum + entry.nodes.length, 0),
        totalEdges: history.reduce((sum, entry) => sum + entry.edges.length, 0),
        operationTypes: history.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1
            return acc
        }, {}),
        timeSpans: history.reduce((acc, entry) => {
            const date = new Date(entry.metadata.timestamp)
            const hour = date.getHours()
            const dayOfWeek = date.getDay()
            acc[hour] = (acc[hour] || 0) + 1
            acc[`day_${dayOfWeek}`] = (acc[`day_${dayOfWeek}`] || 0) + 1
            return acc
        }, {}),
        mostActivePeriod: null
    }

    const operationFrequency = Object.entries(historyStats.operationTypes)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => ({
            type,
            count,
            percentage: ((count / history.length) * 100).toFixed(1)
        }))

    const recentActivity = history.filter((entry) => {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24 hours
        return new Date(entry.metadata.timestamp).getTime() > cutoff
    })

    const sessionSummary = history.reduce((acc, entry) => {
        const session = entry.metadata.session || 'default'
        if (!acc[session]) {
            acc[session] = {
                count: 0,
                firstEntry: entry,
                lastEntry: entry,
                operations: {}
            }
        }
        acc[session].count++
        acc[session].lastEntry = entry
        acc[session].operations[entry.type] = (acc[session].operations[entry.type] || 0) + 1
        return acc
    }, {})

    const getTypeColor = (type) => {
        switch (type) {
            case 'add_nodes':
            case 'connect_edges':
                return 'success'
            case 'delete_nodes':
            case 'disconnect_edges':
                return 'error'
            case 'modify_nodes':
            case 'modify_edges':
                return 'warning'
            case 'load_flow':
                return 'info'
            case 'grouped_operation':
                return 'primary'
            default:
                return 'default'
        }
    }

    const getTypeIcon = (type) => {
        switch (type) {
            case 'add_nodes':
                return <IconPlus size={16} />
            case 'delete_nodes':
                return <IconMinus size={16} />
            case 'modify_nodes':
                return <IconEdit size={16} />
            case 'connect_edges':
                return <IconArrowForwardUp size={16} />
            case 'load_flow':
                return <IconHistory size={16} />
            default:
                return <IconHistory size={16} />
        }
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const showDiff = (entry) => {
        setSelectedEntry(entry)
        setDiffDialogOpen(true)
    }

    const renderChangeSummary = (entry) => {
        const { changes } = entry
        const summary = []

        if (changes.nodes?.addedNodes?.length > 0) {
            summary.push(
                <Chip
                    key='added-nodes'
                    icon={<IconPlus size={14} />}
                    label={`+${changes.nodes.addedNodes.length} nodes`}
                    size='small'
                    color='success'
                    variant='outlined'
                />
            )
        }

        if (changes.nodes?.removedNodes?.length > 0) {
            summary.push(
                <Chip
                    key='removed-nodes'
                    icon={<IconMinus size={14} />}
                    label={`-${changes.nodes.removedNodes.length} nodes`}
                    size='small'
                    color='error'
                    variant='outlined'
                />
            )
        }

        if (changes.nodes?.modifiedNodes?.length > 0) {
            summary.push(
                <Chip
                    key='modified-nodes'
                    icon={<IconEdit size={14} />}
                    label={`~${changes.nodes.modifiedNodes.length} nodes`}
                    size='small'
                    color='warning'
                    variant='outlined'
                />
            )
        }

        if (changes.edges?.addedEdges?.length > 0) {
            summary.push(
                <Chip
                    key='added-edges'
                    icon={<IconArrowForwardUp size={14} />}
                    label={`+${changes.edges.addedEdges.length} edges`}
                    size='small'
                    color='success'
                    variant='outlined'
                />
            )
        }

        if (changes.edges?.removedEdges?.length > 0) {
            summary.push(
                <Chip
                    key='removed-edges'
                    icon={<IconArrowBackUp size={14} />}
                    label={`-${changes.edges.removedEdges.length} edges`}
                    size='small'
                    color='error'
                    variant='outlined'
                />
            )
        }

        return summary
    }

    const renderHistoryEntry = (entry, index) => {
        const isSelected = index === historyIndex
        const isGrouped = entry.type === 'grouped_operation'

        return (
            <ListItem key={entry.id} disablePadding sx={{ mb: 1 }}>
                <Card
                    sx={{
                        width: '100%',
                        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                        backgroundColor: isSelected ? theme.palette.primary.light + '20' : 'transparent'
                    }}
                >
                    <CardContent sx={{ p: 2, pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    icon={getTypeIcon(entry.type)}
                                    label={entry.type.replace('_', ' ')}
                                    size='small'
                                    color={getTypeColor(entry.type)}
                                />
                                {isGrouped && <Chip label={`${entry.operations?.length || 0} ops`} size='small' variant='outlined' />}
                            </Box>
                            <Typography variant='caption' color='text.secondary'>
                                {formatTimestamp(entry.metadata.timestamp)}
                            </Typography>
                        </Box>

                        <Typography variant='body2' sx={{ mb: 1, fontWeight: isSelected ? 700 : 400 }}>
                            {entry.metadata.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{renderChangeSummary(entry)}</Box>

                        {isGrouped && entry.operations && (
                            <Accordion sx={{ mt: 1, boxShadow: 'none' }}>
                                <AccordionSummary expandIcon={<IconChevronDown />}>
                                    <Typography variant='caption'>View individual operations</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List dense>
                                        {entry.operations.map((op, opIndex) => (
                                            <ListItem key={opIndex} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={op.metadata.description}
                                                    secondary={formatTimestamp(op.metadata.timestamp)}
                                                    primaryTypographyProps={{ variant: 'caption' }}
                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </CardContent>

                    <CardActions sx={{ p: 1, pt: 0 }}>
                        <Button size='small' startIcon={<IconEye />} onClick={() => showDiff(entry)} sx={{ mr: 1 }}>
                            View Changes
                        </Button>
                        <Button size='small' variant='outlined' onClick={() => onRestore(entry)} disabled={isSelected}>
                            Restore
                        </Button>
                    </CardActions>
                </Card>
            </ListItem>
        )
    }

    const renderListView = () => <List>{history.map((entry, index) => renderHistoryEntry(entry, index))}</List>

    const renderTimelineView = () => (
        <HistoryTimeline history={history} historyIndex={historyIndex} onRestore={onRestore} onViewChanges={showDiff} />
    )

    return (
        <>
            <Modal open={open} onClose={onClose}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 800,
                        maxWidth: '90vw',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 2,
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconHistory style={{ marginRight: 8 }} />
                                History
                            </Typography>
                            <IconButton onClick={onClose} size='small'>
                                <IconX />
                            </IconButton>
                        </Box>

                        {/* Quick Actions */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant='outlined'
                                startIcon={<IconArrowBackUp />}
                                onClick={onUndo}
                                disabled={!history.length || historyIndex <= 0}
                                size='small'
                            >
                                Undo (Ctrl+Z)
                            </Button>
                            <Button
                                variant='outlined'
                                startIcon={<IconArrowForwardUp />}
                                onClick={onRedo}
                                disabled={!history.length || historyIndex >= history.length - 1}
                                size='small'
                            >
                                Redo (Ctrl+Y)
                            </Button>
                            <Button
                                variant='outlined'
                                startIcon={<IconTrash />}
                                onClick={onClearHistory}
                                disabled={!history.length}
                                size='small'
                                color='error'
                            >
                                Clear History
                            </Button>
                        </Box>

                        {/* History Stats */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant='body2' color='text.secondary'>
                                {history.length} entries
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Current: {historyIndex + 1} of {history.length}
                            </Typography>
                        </Box>

                        {/* View Tabs */}
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mt: 2 }}>
                            <Tab icon={<IconList size={16} />} label='List View' iconPosition='start' />
                            <Tab icon={<IconTimeline size={16} />} label='Timeline View' iconPosition='start' />
                            <Tab icon={<IconTrendingUp size={16} />} label='Analytics' iconPosition='start' />
                        </Tabs>
                    </Box>

                    {/* History Content */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                        {history.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <IconHistory size={48} color={theme.palette.text.secondary} />
                                <Typography variant='body1' color='text.secondary' sx={{ mt: 2 }}>
                                    No history yet
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Start making changes to see them here
                                </Typography>
                            </Box>
                        ) : activeTab === 0 ? (
                            renderListView()
                        ) : activeTab === 1 ? (
                            renderTimelineView()
                        ) : (
                            <HistoryAnalytics
                                history={history}
                                historyStats={historyStats}
                                operationFrequency={operationFrequency}
                                recentActivity={recentActivity}
                                sessionSummary={sessionSummary}
                            />
                        )}
                    </Box>
                </Box>
            </Modal>

            {/* Diff Dialog */}
            <Dialog open={diffDialogOpen} onClose={() => setDiffDialogOpen(false)} maxWidth='md' fullWidth>
                <DialogTitle>Changes in &quot;{selectedEntry?.metadata?.description}&quot;</DialogTitle>
                <DialogContent>
                    {selectedEntry && (
                        <Box>
                            <Typography variant='subtitle2' sx={{ mb: 2 }}>
                                {formatTimestamp(selectedEntry.metadata.timestamp)}
                            </Typography>

                            {/* Node Changes */}
                            {selectedEntry.changes.nodes && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant='h6' sx={{ mb: 1 }}>
                                        Node Changes
                                    </Typography>

                                    {selectedEntry.changes.nodes.addedNodes?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant='subtitle2' color='success.main'>
                                                Added Nodes ({selectedEntry.changes.nodes.addedNodes.length})
                                            </Typography>
                                            <List dense>
                                                {selectedEntry.changes.nodes.addedNodes.map((node, index) => (
                                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={node.data?.label || node.type}
                                                            secondary={`ID: ${node.id}`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    {selectedEntry.changes.nodes.removedNodes?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant='subtitle2' color='error.main'>
                                                Removed Nodes ({selectedEntry.changes.nodes.removedNodes.length})
                                            </Typography>
                                            <List dense>
                                                {selectedEntry.changes.nodes.removedNodes.map((node, index) => (
                                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={node.data?.label || node.type}
                                                            secondary={`ID: ${node.id}`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    {selectedEntry.changes.nodes.modifiedNodes?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant='subtitle2' color='warning.main'>
                                                Modified Nodes ({selectedEntry.changes.nodes.modifiedNodes.length})
                                            </Typography>
                                            <List dense>
                                                {selectedEntry.changes.nodes.modifiedNodes.map((node, index) => (
                                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={node.data?.label || node.type}
                                                            secondary={`ID: ${node.id}`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Edge Changes */}
                            {selectedEntry.changes.edges && (
                                <Box>
                                    <Typography variant='h6' sx={{ mb: 1 }}>
                                        Edge Changes
                                    </Typography>

                                    {selectedEntry.changes.edges.addedEdges?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant='subtitle2' color='success.main'>
                                                Added Edges ({selectedEntry.changes.edges.addedEdges.length})
                                            </Typography>
                                            <List dense>
                                                {selectedEntry.changes.edges.addedEdges.map((edge, index) => (
                                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={`${edge.source} → ${edge.target}`}
                                                            secondary={`ID: ${edge.id}`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    {selectedEntry.changes.edges.removedEdges?.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant='subtitle2' color='error.main'>
                                                Removed Edges ({selectedEntry.changes.edges.removedEdges.length})
                                            </Typography>
                                            <List dense>
                                                {selectedEntry.changes.edges.removedEdges.map((edge, index) => (
                                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={`${edge.source} → ${edge.target}`}
                                                            secondary={`ID: ${edge.id}`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDiffDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

EnhancedHistoryModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    history: PropTypes.array.isRequired,
    historyIndex: PropTypes.number.isRequired,
    onUndo: PropTypes.func.isRequired,
    onRedo: PropTypes.func.isRequired,
    onRestore: PropTypes.func.isRequired,
    onClearHistory: PropTypes.func.isRequired
}

export default EnhancedHistoryModal
