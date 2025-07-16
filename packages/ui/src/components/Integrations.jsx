import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useNavigate } from 'react-router-dom'
import EmailIcon from '@mui/icons-material/Email'
import ChatIcon from '@mui/icons-material/Chat'
import CloudIcon from '@mui/icons-material/Cloud'
import CampaignIcon from '@mui/icons-material/Campaign'
import StorageIcon from '@mui/icons-material/Storage'
import StorefrontIcon from '@mui/icons-material/Storefront'
import TableChartIcon from '@mui/icons-material/TableChart'
import VideocamIcon from '@mui/icons-material/Videocam'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import NoteIcon from '@mui/icons-material/Note'
import TwitterIcon from '@mui/icons-material/Twitter'

const integrations = [
    { name: 'Gmail', category: 'Email', logo: <EmailIcon fontSize='large' />, rating: 4.9, users: '2M+' },
    { name: 'Slack', category: 'Communication', logo: <ChatIcon fontSize='large' />, rating: 4.8, users: '1.5M+' },
    { name: 'Salesforce', category: 'CRM', logo: <CloudIcon fontSize='large' />, rating: 4.7, users: '800K+' },
    { name: 'HubSpot', category: 'Marketing', logo: <CampaignIcon fontSize='large' />, rating: 4.8, users: '600K+' },
    { name: 'PostgreSQL', category: 'Database', logo: <StorageIcon fontSize='large' />, rating: 4.9, users: '500K+' },
    { name: 'Shopify', category: 'E-commerce', logo: <StorefrontIcon fontSize='large' />, rating: 4.7, users: '400K+' },
    { name: 'Google Sheets', category: 'Productivity', logo: <TableChartIcon fontSize='large' />, rating: 4.8, users: '1.2M+' },
    { name: 'Zoom', category: 'Video', logo: <VideocamIcon fontSize='large' />, rating: 4.6, users: '300K+' },
    { name: 'Stripe', category: 'Payment', logo: <CreditCardIcon fontSize='large' />, rating: 4.9, users: '700K+' },
    { name: 'Discord', category: 'Communication', logo: <SportsEsportsIcon fontSize='large' />, rating: 4.5, users: '200K+' },
    { name: 'Notion', category: 'Productivity', logo: <NoteIcon fontSize='large' />, rating: 4.7, users: '350K+' },
    { name: 'Twitter', category: 'Social', logo: <TwitterIcon fontSize='large' />, rating: 4.4, users: '150K+' }
]

const categories = ['All', 'Email', 'Communication', 'CRM', 'Marketing', 'Database', 'E-commerce', 'Productivity']

const Integrations = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const navigate = useNavigate()

    const filteredIntegrations = integrations.filter((integration) => {
        const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <Box sx={{ py: 12, background: '#f9fafb' }}>
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant='h3' sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: { xs: 28, md: 36 } }}>
                        Connect with 400+ apps
                    </Typography>
                    <Typography variant='h6' sx={{ color: '#4b5563', maxWidth: 600, mx: 'auto', fontSize: 20, fontWeight: 400, mb: 4 }}>
                        Integrate with all your favorite tools and services. No limits, no restrictions.
                    </Typography>
                    <Box sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                        <TextField
                            fullWidth
                            variant='outlined'
                            placeholder='Search integrations...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size='medium'
                            sx={{
                                background: '#fff',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    fontSize: 18,
                                    py: 1.5,
                                    pl: 2
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mb: 2 }}>
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? 'contained' : 'outlined'}
                                onClick={() => setSelectedCategory(category)}
                                sx={{
                                    background: selectedCategory === category ? 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)' : '#fff',
                                    color: selectedCategory === category ? '#fff' : '#7c3aed',
                                    borderColor: '#a78bfa',
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: 2,
                                    fontWeight: 500,
                                    fontSize: 15,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        background:
                                            selectedCategory === category ? 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)' : '#ede9fe',
                                        color: selectedCategory === category ? '#fff' : '#7c3aed'
                                    }
                                }}
                            >
                                {category}
                            </Button>
                        ))}
                    </Box>
                </Box>
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    {filteredIntegrations.map((integration, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: '1px solid #e5e7eb',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: '#a78bfa',
                                        boxShadow: 6,
                                        transform: 'translateY(-4px)'
                                    },
                                    height: '100%'
                                }}
                                onClick={() => navigate(`/integrations/${integration.name.toLowerCase()}`)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ fontSize: 32 }}>{integration.logo}</Box>
                                    <Box sx={{ fontSize: 13, background: '#f3f4f6', color: '#6b7280', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                        {integration.category}
                                    </Box>
                                </Box>
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
                                    {integration.name}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 15,
                                        color: '#6b7280'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <span style={{ fontSize: 16 }}>⭐</span>
                                        <span>{integration.rating}</span>
                                    </Box>
                                    <span>{integration.users}</span>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#6b7280', mb: 2 }}>Don&apos;t see your app? We add new integrations every week.</Typography>
                    <Button
                        variant='outlined'
                        sx={{
                            borderColor: '#a78bfa',
                            color: '#7c3aed',
                            fontWeight: 500,
                            '&:hover': { background: '#ede9fe', borderColor: '#7c3aed' }
                        }}
                    >
                        Request an integration
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default Integrations
