import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { ArrowRight, Clock, Star, Users, Filter } from 'lucide-react'

const templates = [
    {
        id: 1,
        title: 'Lead Qualification & CRM Sync',
        description: 'Automatically qualify leads from web forms and sync to your CRM with enriched data.',
        category: 'Sales',
        difficulty: 'Beginner',
        time: '5 min',
        rating: 4.9,
        users: 15234,
        apps: ['📧', '☁️', '📊'],
        tags: ['CRM', 'Lead Generation', 'Automation']
    },
    {
        id: 2,
        title: 'Customer Support Ticket Routing',
        description: 'Smart ticket routing based on keywords, priority, and team availability.',
        category: 'Support',
        difficulty: 'Intermediate',
        time: '10 min',
        rating: 4.8,
        users: 12891,
        apps: ['🎫', '💬', '📧'],
        tags: ['Support', 'Automation', 'Routing']
    },
    {
        id: 3,
        title: 'Social Media Content Publishing',
        description: 'Schedule and publish content across multiple social platforms simultaneously.',
        category: 'Marketing',
        difficulty: 'Beginner',
        time: '3 min',
        rating: 4.7,
        users: 18743,
        apps: ['🐦', '📘', '📸'],
        tags: ['Social Media', 'Content', 'Scheduling']
    },
    {
        id: 4,
        title: 'E-commerce Order Processing',
        description: 'Automate order fulfillment, inventory updates, and customer notifications.',
        category: 'E-commerce',
        difficulty: 'Advanced',
        time: '15 min',
        rating: 4.9,
        users: 9876,
        apps: ['🛒', '📦', '📧'],
        tags: ['E-commerce', 'Fulfillment', 'Inventory']
    },
    {
        id: 5,
        title: 'Meeting Scheduler & Follow-up',
        description: 'Automatically schedule meetings and send follow-up emails with meeting notes.',
        category: 'Productivity',
        difficulty: 'Intermediate',
        time: '8 min',
        rating: 4.6,
        users: 14567,
        apps: ['📅', '📹', '📧'],
        tags: ['Meetings', 'Scheduling', 'Follow-up']
    },
    {
        id: 6,
        title: 'Invoice Generation & Payment Tracking',
        description: 'Generate invoices automatically and track payments across multiple channels.',
        category: 'Finance',
        difficulty: 'Intermediate',
        time: '12 min',
        rating: 4.8,
        users: 11234,
        apps: ['💳', '📊', '💰'],
        tags: ['Finance', 'Invoicing', 'Payments']
    }
]

const categories = ['All', 'Sales', 'Marketing', 'Support', 'E-commerce', 'Productivity', 'Finance']
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'Beginner':
            return { color: '#16a34a', background: '#dcfce7' }
        case 'Intermediate':
            return { color: '#ca8a04', background: '#fef9c3' }
        case 'Advanced':
            return { color: '#dc2626', background: '#fee2e2' }
        default:
            return { color: '#6b7280', background: '#f3f4f6' }
    }
}

const Templates = () => {
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedDifficulty, setSelectedDifficulty] = useState('All')

    const filteredTemplates = templates.filter((template) => {
        const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
        const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty
        return matchesCategory && matchesDifficulty
    })

    return (
        <Box sx={{ py: 12, background: '#fff' }}>
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant='h3' sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: { xs: 28, md: 36 } }}>
                        Ready-to-use workflow templates
                    </Typography>
                    <Typography variant='h6' sx={{ color: '#4b5563', maxWidth: 600, mx: 'auto', fontSize: 20, fontWeight: 400, mb: 4 }}>
                        Start with proven workflows designed by automation experts. Customize them to fit your needs perfectly.
                    </Typography>
                    {/* Filters */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='center' alignItems='center' sx={{ mb: 4 }}>
                        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                            <Typography variant='body2' sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', mr: 1 }}>
                                <Filter style={{ width: 16, height: 16, marginRight: 4 }} />
                                Category:
                            </Typography>
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? 'contained' : 'outlined'}
                                    size='small'
                                    onClick={() => setSelectedCategory(category)}
                                    sx={{
                                        background:
                                            selectedCategory === category ? 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)' : '#fff',
                                        color: selectedCategory === category ? '#fff' : '#7c3aed',
                                        borderColor: '#a78bfa',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 500,
                                        fontSize: 14,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            background:
                                                selectedCategory === category
                                                    ? 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)'
                                                    : '#ede9fe',
                                            color: selectedCategory === category ? '#fff' : '#7c3aed'
                                        }
                                    }}
                                >
                                    {category}
                                </Button>
                            ))}
                        </Stack>
                        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                            <Typography variant='body2' sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', mr: 1 }}>
                                Difficulty:
                            </Typography>
                            {difficulties.map((difficulty) => (
                                <Button
                                    key={difficulty}
                                    variant={selectedDifficulty === difficulty ? 'contained' : 'outlined'}
                                    size='small'
                                    onClick={() => setSelectedDifficulty(difficulty)}
                                    sx={{
                                        background:
                                            selectedDifficulty === difficulty ? 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)' : '#fff',
                                        color: selectedDifficulty === difficulty ? '#fff' : '#7c3aed',
                                        borderColor: '#a78bfa',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 500,
                                        fontSize: 14,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            background:
                                                selectedDifficulty === difficulty
                                                    ? 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)'
                                                    : '#ede9fe',
                                            color: selectedDifficulty === difficulty ? '#fff' : '#7c3aed'
                                        }
                                    }}
                                >
                                    {difficulty}
                                </Button>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
                {/* Templates Grid */}
                <Grid container spacing={4} sx={{ mb: 8 }}>
                    {filteredTemplates.map((template) => (
                        <Grid item xs={12} md={6} lg={4} key={template.id}>
                            <Paper
                                elevation={0}
                                sx={{
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 3,
                                    p: 3,
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: '#a78bfa',
                                        boxShadow: 6,
                                        transform: 'translateY(-4px)'
                                    },
                                    height: '100%'
                                }}
                            >
                                {/* Header */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                    <Stack direction='row' spacing={0.5} alignItems='center'>
                                        {template.apps.map((app, index) => (
                                            <Box key={index} sx={{ fontSize: 22 }}>
                                                {app}
                                            </Box>
                                        ))}
                                    </Stack>
                                    <Box
                                        sx={{
                                            fontSize: 12,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            fontWeight: 500,
                                            ...getDifficultyColor(template.difficulty)
                                        }}
                                    >
                                        {template.difficulty}
                                    </Box>
                                </Box>
                                {/* Content */}
                                <Typography
                                    variant='subtitle1'
                                    sx={{
                                        fontWeight: 600,
                                        color: '#111827',
                                        mb: 1,
                                        transition: 'color 0.3s',
                                        '&:hover': { color: '#7c3aed' }
                                    }}
                                >
                                    {template.title}
                                </Typography>
                                <Typography variant='body2' sx={{ color: '#4b5563', fontSize: 15, mb: 2, lineHeight: 1.6 }}>
                                    {template.description}
                                </Typography>
                                {/* Tags */}
                                <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mb: 2 }}>
                                    {template.tags.map((tag, index) => (
                                        <Box
                                            key={index}
                                            sx={{ fontSize: 12, background: '#f3f4f6', color: '#6b7280', px: 1, py: 0.5, borderRadius: 2 }}
                                        >
                                            {tag}
                                        </Box>
                                    ))}
                                </Stack>
                                {/* Stats */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 14,
                                        color: '#6b7280',
                                        mb: 2
                                    }}
                                >
                                    <Stack direction='row' spacing={2} alignItems='center'>
                                        <Stack direction='row' spacing={0.5} alignItems='center'>
                                            <Clock style={{ width: 16, height: 16 }} />
                                            <span>{template.time}</span>
                                        </Stack>
                                        <Stack direction='row' spacing={0.5} alignItems='center'>
                                            <Star style={{ width: 16, height: 16, color: '#facc15' }} />
                                            <span>{template.rating}</span>
                                        </Stack>
                                        <Stack direction='row' spacing={0.5} alignItems='center'>
                                            <Users style={{ width: 16, height: 16 }} />
                                            <span>{template.users.toLocaleString()}</span>
                                        </Stack>
                                    </Stack>
                                </Box>
                                {/* CTA */}
                                <Button
                                    variant='outlined'
                                    fullWidth
                                    sx={{
                                        borderColor: '#a78bfa',
                                        color: '#7c3aed',
                                        fontWeight: 500,
                                        mt: 1,
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                            color: '#fff',
                                            borderColor: '#7c3aed'
                                        },
                                        transition: 'all 0.3s'
                                    }}
                                    endIcon={<ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />}
                                >
                                    Use this template
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                {/* Browse More CTA */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#6b7280', mb: 2 }}>Can&apos;t find what you&apos;re looking for?</Typography>
                    <Button
                        variant='outlined'
                        sx={{
                            borderColor: '#a78bfa',
                            color: '#7c3aed',
                            fontWeight: 500,
                            '&:hover': { background: '#ede9fe', borderColor: '#7c3aed' }
                        }}
                        endIcon={<ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />}
                    >
                        Browse all 500+ templates
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default Templates
