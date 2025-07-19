import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import { Card, CardContent, Typography, Box, Chip, IconButton, Collapse, List, ListItem, ListItemText, ListItemIcon } from '@mui/material'
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
} from '@mui/lab'
import { useTheme } from '@mui/material/styles'

// icons
import {
    IconPlus,
    IconMinus,
    IconEdit,
    IconArrowForwardUp,
    IconArrowBackUp,
    IconHistory,
    IconEye,
    IconRestore,
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react'

// ==============================|| HISTORY TIMELINE ||============================== //

const HistoryTimeline = ({ history, historyIndex, onRestore, onViewChanges }) => {
    const theme = useTheme()
    const [expandedItems, setExpandedItems] = useState(new Set())

    const getTypeColor = (type) => {
        switch (type) {
            case 'add_nodes':
            case 'connect_edges':
                return 'success'
            case 'delete_nodes':
            case 'delete_edges':
                return 'error'
            case 'modify_nodes':
            case 'modify_edges':
            case 'move_nodes':
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
            case 'modify_edges':
                return <IconEdit size={16} />
            case 'connect_edges':
                return <IconArrowForwardUp size={16} />
            case 'delete_edges':
                return <IconArrowBackUp size={16} />
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

    const getChangeSummary = (entry) => {
        const { changes } = entry
        const summary = []

        if (changes.nodes?.addedNodes?.length > 0) {
            summary.push(`${changes.nodes.addedNodes.length} node${changes.nodes.addedNodes.length > 1 ? 's' : ''} added`)
        }
        if (changes.nodes?.removedNodes?.length > 0) {
            summary.push(`${changes.nodes.removedNodes.length} node${changes.nodes.removedNodes.length > 1 ? 's' : ''} removed`)
        }
        if (changes.nodes?.modifiedNodes?.length > 0) {
            summary.push(`${changes.nodes.modifiedNodes.length} node${changes.nodes.modifiedNodes.length > 1 ? 's' : ''} modified`)
        }
        if (changes.edges?.addedEdges?.length > 0) {
            summary.push(`${changes.edges.addedEdges.length} edge${changes.edges.addedEdges.length > 1 ? 's' : ''} added`)
        }
        if (changes.edges?.removedEdges?.length > 0) {
            summary.push(`${changes.edges.removedEdges.length} edge${changes.edges.removedEdges.length > 1 ? 's' : ''} removed`)
        }

        return summary.join(', ')
    }

    const toggleExpanded = (entryId) => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(entryId)) {
                newSet.delete(entryId)
            } else {
                newSet.add(entryId)
            }
            return newSet
        })
    }

    const isExpanded = (entryId) => expandedItems.has(entryId)

    const renderTimelineItem = (entry, index) => {
        const isSelected = index === historyIndex
        const isGrouped = entry.type === 'grouped_operation'
        const expanded = isExpanded(entry.id)

        return (
            <TimelineItem key={entry.id}>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} variant='body2' color='text.secondary'>
                    {formatTimestamp(entry.metadata.timestamp)}
                </TimelineOppositeContent>

                <TimelineSeparator>
                    <TimelineDot
                        color={getTypeColor(entry.type)}
                        sx={{
                            backgroundColor: isSelected ? theme.palette.primary.main : undefined,
                            border: isSelected ? `2px solid ${theme.palette.primary.main}` : undefined
                        }}
                    >
                        {getTypeIcon(entry.type)}
                    </TimelineDot>
                    {index < history.length - 1 && (
                        <TimelineConnector
                            sx={{
                                backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.divider
                            }}
                        />
                    )}
                </TimelineSeparator>

                <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Card
                        sx={{
                            border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                            borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                            backgroundColor: isSelected ? theme.palette.primary.light + '20' : 'transparent',
                            transition: 'all 0.2s ease-in-out'
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
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size='small' onClick={() => onViewChanges(entry)} title='View changes'>
                                        <IconEye size={16} />
                                    </IconButton>
                                    <IconButton
                                        size='small'
                                        onClick={() => toggleExpanded(entry.id)}
                                        title={expanded ? 'Collapse' : 'Expand'}
                                    >
                                        {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                    </IconButton>
                                </Box>
                            </Box>

                            <Typography variant='body2' sx={{ mb: 1, fontWeight: isSelected ? 600 : 400 }}>
                                {entry.metadata.description}
                            </Typography>

                            <Typography variant='caption' color='text.secondary'>
                                {getChangeSummary(entry)}
                            </Typography>

                            <Collapse in={expanded}>
                                <Box sx={{ mt: 2 }}>
                                    {isGrouped && entry.operations && (
                                        <List dense>
                                            {entry.operations.map((op, opIndex) => (
                                                <ListItem key={opIndex} sx={{ py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>{getTypeIcon(op.type)}</ListItemIcon>
                                                    <ListItemText
                                                        primary={op.metadata.description}
                                                        secondary={formatTimestamp(op.metadata.timestamp)}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                        secondaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}

                                    {entry.metadata.source && (
                                        <Chip label={`Source: ${entry.metadata.source}`} size='small' variant='outlined' sx={{ mt: 1 }} />
                                    )}
                                </Box>
                            </Collapse>
                        </CardContent>

                        <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton
                                size='small'
                                onClick={() => onRestore(entry)}
                                disabled={isSelected}
                                title='Restore to this state'
                                sx={{
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light + '20'
                                    }
                                }}
                            >
                                <IconRestore size={16} />
                            </IconButton>
                        </Box>
                    </Card>
                </TimelineContent>
            </TimelineItem>
        )
    }

    return <Timeline position='alternate'>{history.map((entry, index) => renderTimelineItem(entry, index))}</Timeline>
}

HistoryTimeline.propTypes = {
    history: PropTypes.array.isRequired,
    historyIndex: PropTypes.number.isRequired,
    onRestore: PropTypes.func.isRequired,
    onViewChanges: PropTypes.func.isRequired
}

export default HistoryTimeline
