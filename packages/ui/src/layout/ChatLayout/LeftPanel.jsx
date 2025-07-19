import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    IconButton,
    Avatar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

// icons
import { IconSearch, IconPlus, IconStar, IconClock, IconFolder, IconGift, IconX } from '@tabler/icons-react'

// project imports
import { useGlobalChat } from '@/store/context/GlobalChatContext'
import useApi from '@/hooks/useApi'
import chatflowsApi from '@/api/chatflows'

// ==============================|| LEFT PANEL ||============================== //

const LeftPanel = ({ onToggle, isOpen }) => {
    const theme = useTheme()
    const { currentProject, loadProject, createNewProject } = useGlobalChat()

    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')
    const [projects, setProjects] = useState([])
    const [recentProjects, setRecentProjects] = useState([])

    // API
    const getAllProjectsApi = useApi(chatflowsApi.getAllAgentflows)

    // Load projects
    useEffect(() => {
        getAllProjectsApi.request('AGENTFLOW')
    }, [])

    useEffect(() => {
        if (getAllProjectsApi.data) {
            setProjects(getAllProjectsApi.data)
            // Get recent projects (last 5)
            setRecentProjects(getAllProjectsApi.data.slice(0, 5))
        }
    }, [getAllProjectsApi.data])

    // Filter projects based on search and active filter
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeFilter === 'all') return matchesSearch
        if (activeFilter === 'favorites') return matchesSearch && project.isFavorite
        if (activeFilter === 'recent') return recentProjects.some((rp) => rp.id === project.id)

        return matchesSearch
    })

    // Handle project selection
    const handleProjectSelect = async (project) => {
        try {
            await loadProject(project.id)
        } catch (error) {
            console.error('Error loading project:', error)
        }
    }

    // Handle new project creation
    const handleNewProject = async () => {
        try {
            const projectName = `New Project ${Date.now()}`
            await createNewProject(projectName, 'Created from chat interface')
        } catch (error) {
            console.error('Error creating project:', error)
        }
    }

    // Get project icon based on type
    const getProjectIcon = (project) => {
        if (project.type === 'AGENTFLOW') return '🤖'
        if (project.type === 'MULTIAGENT') return '👥'
        return '📋'
    }

    // Get project status
    const getProjectStatus = (project) => {
        if (project.deployed) return { label: 'Deployed', color: 'success' }
        if (project.flowData) return { label: 'Draft', color: 'warning' }
        return { label: 'Empty', color: 'default' }
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Projects
                </Typography>
                <IconButton onClick={onToggle} size='small'>
                    <IconX size={20} />
                </IconButton>
            </Box>

            {/* Search */}
            <Box sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    size='small'
                    placeholder='Search projects...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <IconSearch size={18} style={{ marginRight: 8 }} />
                    }}
                    sx={{ mb: 2 }}
                />

                {/* New Project Button */}
                <Button fullWidth variant='contained' startIcon={<IconPlus size={18} />} onClick={handleNewProject} sx={{ mb: 2 }}>
                    New Project
                </Button>

                {/* Filter Chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All', icon: IconFolder },
                        { key: 'favorites', label: 'Favorites', icon: IconStar },
                        { key: 'recent', label: 'Recent', icon: IconClock }
                    ].map((filter) => (
                        <Chip
                            key={filter.key}
                            label={filter.label}
                            size='small'
                            variant={activeFilter === filter.key ? 'filled' : 'outlined'}
                            onClick={() => setActiveFilter(filter.key)}
                            icon={<filter.icon size={14} />}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Divider />

            {/* Project List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ py: 0 }}>
                    {filteredProjects.map((project) => {
                        const isActive = currentProject?.id === project.id
                        const status = getProjectStatus(project)

                        return (
                            <ListItem key={project.id} disablePadding>
                                <ListItemButton
                                    selected={isActive}
                                    onClick={() => handleProjectSelect(project)}
                                    sx={{
                                        mx: 1,
                                        mb: 0.5,
                                        borderRadius: 1,
                                        '&.Mui-selected': {
                                            backgroundColor: theme.palette.primary.light + '20',
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.light + '30'
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                fontSize: '14px',
                                                bgcolor: isActive ? theme.palette.primary.main : theme.palette.grey[300]
                                            }}
                                        >
                                            {getProjectIcon(project)}
                                        </Avatar>
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant='body2'
                                                    sx={{
                                                        fontWeight: isActive ? 600 : 400,
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {project.name}
                                                </Typography>
                                                <Chip
                                                    label={status.label}
                                                    size='small'
                                                    color={status.color}
                                                    variant='outlined'
                                                    sx={{ height: 20, fontSize: '10px' }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant='caption'
                                                color='text.secondary'
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {project.description || 'No description'}
                                            </Typography>
                                        }
                                    />

                                    {project.isFavorite && (
                                        <IconStar size={16} color={theme.palette.warning.main} style={{ marginLeft: 8 }} />
                                    )}
                                </ListItemButton>
                            </ListItem>
                        )
                    })}

                    {filteredProjects.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant='body2' color='text.secondary'>
                                {searchQuery ? 'No projects found' : 'No projects yet'}
                            </Typography>
                        </Box>
                    )}
                </List>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button fullWidth variant='outlined' startIcon={<IconGift size={18} />} sx={{ mb: 1 }}>
                    Share FloWise
                </Button>
                <Typography variant='caption' color='text.secondary' align='center' display='block'>
                    Get 500 credits each
                </Typography>
            </Box>
        </Box>
    )
}

LeftPanel.propTypes = {
    onToggle: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired
}

export default LeftPanel
