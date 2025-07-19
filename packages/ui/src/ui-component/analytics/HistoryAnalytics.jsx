import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// icons
import {
    IconHistory,
    IconPlus,
    IconMinus,
    IconEdit,
    IconArrowForwardUp,
    IconArrowBackUp,
    IconClock,
    IconCalendar,
    IconTrendingUp,
    IconChevronDown
} from '@tabler/icons-react'

// ==============================|| HISTORY ANALYTICS ||============================== //

const HistoryAnalytics = ({ history, historyStats, operationFrequency, recentActivity, sessionSummary }) => {
    const theme = useTheme()
    const [expanded, setExpanded] = useState(false)

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
            case 'delete_edges':
                return <IconArrowBackUp size={16} />
            default:
                return <IconHistory size={16} />
        }
    }

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
                return 'warning'
            case 'load_flow':
                return 'info'
            default:
                return 'default'
        }
    }

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const getTimeOfDay = (hour) => {
        if (hour < 6) return 'Early Morning'
        if (hour < 12) return 'Morning'
        if (hour < 18) return 'Afternoon'
        if (hour < 22) return 'Evening'
        return 'Night'
    }

    const getDayOfWeek = (day) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[day]
    }

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant='h4' color='primary'>
                                        {historyStats.totalEntries}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Total Entries
                                    </Typography>
                                </Box>
                                <IconHistory size={32} color={theme.palette.primary.main} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant='h4' color='success.main'>
                                        {historyStats.totalNodes}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Total Nodes
                                    </Typography>
                                </Box>
                                <IconPlus size={32} color={theme.palette.success.main} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant='h4' color='info.main'>
                                        {historyStats.totalEdges}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Total Edges
                                    </Typography>
                                </Box>
                                <IconArrowForwardUp size={32} color={theme.palette.info.main} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant='h4' color='warning.main'>
                                        {Object.keys(sessionSummary).length}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Sessions
                                    </Typography>
                                </Box>
                                <IconClock size={32} color={theme.palette.warning.main} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Operation Frequency */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <IconTrendingUp style={{ marginRight: 8 }} />
                        Operation Frequency
                    </Typography>

                    <List>
                        {operationFrequency.map((op, index) => (
                            <ListItem key={index} sx={{ py: 1 }}>
                                <ListItemIcon>{getTypeIcon(op.type)}</ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant='body2'>{op.type.replace('_', ' ')}</Typography>
                                            <Chip label={op.count} size='small' color={getTypeColor(op.type)} />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <LinearProgress
                                                variant='determinate'
                                                value={parseFloat(op.percentage)}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                            <Typography variant='caption' color='text.secondary'>
                                                {op.percentage}% of total operations
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Time Patterns */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <IconClock style={{ marginRight: 8 }} />
                                Time of Day Activity
                            </Typography>

                            <List dense>
                                {Object.entries(historyStats.timeSpans)
                                    .filter(([key]) => !key.startsWith('day_'))
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([hour, count]) => (
                                        <ListItem key={hour} sx={{ py: 0.5 }}>
                                            <ListItemText
                                                primary={`${getTimeOfDay(parseInt(hour))} (${hour}:00)`}
                                                secondary={`${count} operations`}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                                secondaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItem>
                                    ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <IconCalendar style={{ marginRight: 8 }} />
                                Day of Week Activity
                            </Typography>

                            <List dense>
                                {Object.entries(historyStats.timeSpans)
                                    .filter(([key]) => key.startsWith('day_'))
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([day, count]) => {
                                        const dayNum = parseInt(day.replace('day_', ''))
                                        return (
                                            <ListItem key={day} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={getDayOfWeek(dayNum)}
                                                    secondary={`${count} operations`}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                />
                                            </ListItem>
                                        )
                                    })}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Activity */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                        Recent Activity (Last 24 Hours)
                    </Typography>

                    {recentActivity.length === 0 ? (
                        <Typography variant='body2' color='text.secondary'>
                            No recent activity
                        </Typography>
                    ) : (
                        <List dense>
                            {recentActivity.slice(0, 5).map((entry, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                    <ListItemIcon>{getTypeIcon(entry.type)}</ListItemIcon>
                                    <ListItemText
                                        primary={entry.metadata.description}
                                        secondary={new Date(entry.metadata.timestamp).toLocaleTimeString()}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <Chip label={entry.type.replace('_', ' ')} size='small' color={getTypeColor(entry.type)} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Session Summary */}
            <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
                <AccordionSummary expandIcon={<IconChevronDown />}>
                    <Typography variant='h6'>Session Summary</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {Object.entries(sessionSummary).map(([sessionId, session]) => (
                            <Grid item xs={12} md={6} key={sessionId}>
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                                            Session: {sessionId}
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                            {session.count} operations
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                            {new Date(session.firstEntry.metadata.timestamp).toLocaleString()} -
                                            {new Date(session.lastEntry.metadata.timestamp).toLocaleString()}
                                        </Typography>

                                        <Box sx={{ mt: 1 }}>
                                            {Object.entries(session.operations).map(([type, count]) => (
                                                <Chip
                                                    key={type}
                                                    label={`${type}: ${count}`}
                                                    size='small'
                                                    color={getTypeColor(type)}
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

HistoryAnalytics.propTypes = {
    history: PropTypes.array.isRequired,
    historyStats: PropTypes.object.isRequired,
    operationFrequency: PropTypes.array.isRequired,
    recentActivity: PropTypes.array.isRequired,
    sessionSummary: PropTypes.object.isRequired
}

export default HistoryAnalytics
