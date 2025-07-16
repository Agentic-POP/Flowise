import { StyledButton as Button } from '../ui-component/button/StyledButton'
import { Play, ArrowRight, Zap, Users, Shield } from 'lucide-react'
import WorkflowDemo from './WorkflowDemo'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'

const Hero = () => {
    return (
        <Box sx={{ pt: 10, pb: 8, background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 50%, #f3e8ff 100%)' }}>
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1,
                            borderRadius: '999px',
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            fontWeight: 500,
                            fontSize: 14,
                            mb: 3
                        }}
                    >
                        <Zap style={{ width: 16, height: 16, marginRight: 8 }} />
                        Automate anything with AI-powered workflows
                    </Box>
                    <Typography
                        variant='h2'
                        sx={{ fontWeight: 700, color: '#111827', mb: 3, lineHeight: 1.1, fontSize: { xs: 32, md: 56 } }}
                    >
                        Workflow automation
                        <br />
                        <Box
                            component='span'
                            sx={{
                                background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700
                            }}
                        >
                            for everyone
                        </Box>
                    </Typography>
                    <Typography variant='h5' sx={{ color: '#4b5563', mb: 4, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                        Build complex automations 10x faster with our visual workflow builder. Connect any app, automate any process, scale
                        without limits.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center' justifyContent='center' sx={{ mb: 6 }}>
                        <Button
                            size='large'
                            sx={{
                                background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                color: '#fff',
                                px: 4,
                                py: 2,
                                fontSize: 18,
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)'
                                }
                            }}
                        >
                            Start building for free
                            <ArrowRight style={{ marginLeft: 8, width: 20, height: 20 }} />
                        </Button>
                        <Button size='large' variant='outlined' sx={{ px: 4, py: 2, fontSize: 18 }}>
                            <Play style={{ marginRight: 8, width: 20, height: 20 }} />
                            Watch demo
                        </Button>
                    </Stack>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={4}
                        alignItems='center'
                        justifyContent='center'
                        sx={{ color: '#6b7280', fontSize: 15, mb: 8 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Users style={{ width: 16, height: 16, marginRight: 8 }} />
                            <span>500K+ workflows created</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Shield style={{ width: 16, height: 16, marginRight: 8 }} />
                            <span>Enterprise-grade security</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Zap style={{ width: 16, height: 16, marginRight: 8 }} />
                            <span>400+ integrations</span>
                        </Box>
                    </Stack>
                </Box>
                <Box sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, #7c3aed33 0%, #2563eb33 100%)',
                            borderRadius: 6,
                            filter: 'blur(48px)',
                            zIndex: 0
                        }}
                    />
                    <Paper
                        elevation={6}
                        sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden', zIndex: 1, border: '1px solid #e5e7eb' }}
                    >
                        <Box sx={{ background: '#f9fafb', px: 3, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <Box sx={{ width: 12, height: 12, background: '#ef4444', borderRadius: '50%' }} />
                                <Box sx={{ width: 12, height: 12, background: '#f59e42', borderRadius: '50%' }} />
                                <Box sx={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%' }} />
                                <Typography variant='body2' sx={{ ml: 2, color: '#6b7280' }}>
                                    Behalf AI Workflow Builder
                                </Typography>
                            </Stack>
                        </Box>
                        <WorkflowDemo />
                    </Paper>
                </Box>
            </Box>
        </Box>
    )
}

export default Hero
