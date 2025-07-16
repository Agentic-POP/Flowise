import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'

const features = [
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>⚡</span>,
        title: 'Visual Workflow Builder',
        description:
            'Drag and drop to create complex automations without writing code. Build workflows that connect hundreds of apps seamlessly.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>🧩</span>,
        title: '400+ Integrations',
        description: 'Connect with every tool in your stack. From CRM to marketing tools, databases to communication platforms.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>🛡️</span>,
        title: 'Enterprise Security',
        description: 'Bank-grade encryption, SOC 2 compliance, and on-premise deployment options for maximum security.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>📊</span>,
        title: 'Advanced Analytics',
        description: 'Monitor workflow performance, track execution metrics, and optimize your automations with detailed insights.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>💻</span>,
        title: 'Custom Code Nodes',
        description: "When no-code isn't enough, write custom JavaScript, Python, or use our API for unlimited flexibility."
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>📱</span>,
        title: 'Mobile & Browser Extension',
        description: 'Manage workflows on the go with our mobile app and browser extension for seamless automation anywhere.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>🌐</span>,
        title: 'Cloud & Self-Hosted',
        description: 'Deploy in our secure cloud or host on your own infrastructure. Full control over your data and workflows.'
    },
    {
        icon: <span style={{ fontSize: 32, width: 32, height: 32, display: 'inline-block' }}>👥</span>,
        title: 'Team Collaboration',
        description: 'Share workflows, collaborate in real-time, and manage permissions with powerful team features.'
    }
]

const Features = () => {
    return (
        <Box sx={{ py: 12, background: '#fff' }}>
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant='h3' sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: { xs: 28, md: 36 } }}>
                        Everything you need to automate
                    </Typography>
                    <Typography variant='h6' sx={{ color: '#4b5563', maxWidth: 600, mx: 'auto', fontSize: 20, fontWeight: 400 }}>
                        Powerful features that grow with your business, from simple automations to complex enterprise workflows.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={6} lg={3} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: '1px solid #e5e7eb',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        borderColor: '#a78bfa',
                                        boxShadow: 6,
                                        transform: 'translateY(-4px)'
                                    },
                                    height: '100%'
                                }}
                            >
                                <Box
                                    sx={{
                                        color: '#7c3aed',
                                        mb: 2,
                                        transition: 'color 0.3s',
                                        '.MuiPaper-root:hover &': { color: '#6d28d9' }
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant='body2' sx={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                                    {feature.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}

export default Features
