import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StyledButton as Button } from '../ui-component/button/StyledButton'
import { Menu, X, Zap, User } from 'lucide-react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const location = useLocation()

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Workflows', href: '/workflows' },
        { name: 'Templates', href: '/templates' },
        { name: 'Integrations', href: '/integrations' },
        { name: 'Pricing', href: '/pricing' }
    ]

    const isActive = (href) => {
        if (href === '/') {
            return location.pathname === '/'
        }
        return location.pathname.startsWith(href)
    }

    return (
        <AppBar position='sticky' elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 1200 }}>
            <Toolbar
                sx={{
                    maxWidth: '1120px',
                    mx: 'auto',
                    width: '100%',
                    minHeight: 64,
                    px: { xs: 2, sm: 3, lg: 4 },
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                {/* Logo */}
                <Box component={Link} to='/' sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1
                        }}
                    >
                        <Zap style={{ width: 20, height: 20, color: '#fff' }} />
                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 700, color: '#111827', fontSize: 22, letterSpacing: 0.5 }}>
                        Behalf AI
                    </Typography>
                </Box>
                {/* Desktop Navigation */}
                <Stack direction='row' spacing={4} alignItems='center' sx={{ display: { xs: 'none', md: 'flex' } }}>
                    {navigation.map((item) => (
                        <Box
                            key={item.name}
                            component={Link}
                            to={item.href}
                            sx={{
                                textDecoration: 'none',
                                fontSize: 15,
                                fontWeight: 500,
                                color: isActive(item.href) ? '#7c3aed' : '#6b7280',
                                borderBottom: isActive(item.href) ? '2px solid #7c3aed' : '2px solid transparent',
                                pb: isActive(item.href) ? 0.5 : 0,
                                transition: 'color 0.2s, border-bottom 0.2s',
                                '&:hover': { color: '#7c3aed' }
                            }}
                        >
                            {item.name}
                        </Box>
                    ))}
                </Stack>
                {/* Desktop Actions */}
                <Stack direction='row' spacing={2} alignItems='center' sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button variant='ghost' size='small' component={Link} to='/dashboard' sx={{ minWidth: 0, px: 2 }}>
                        <User style={{ width: 18, height: 18, marginRight: 8 }} />
                        Dashboard
                    </Button>
                    <Button
                        sx={{
                            background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                            color: '#fff',
                            px: 3,
                            '&:hover': { background: 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)' }
                        }}
                    >
                        Get Started
                    </Button>
                </Stack>
                {/* Mobile menu button */}
                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                    <Button variant='ghost' size='small' onClick={() => setIsMenuOpen(!isMenuOpen)} sx={{ minWidth: 0, px: 1 }}>
                        {isMenuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
                    </Button>
                </Box>
            </Toolbar>
            {/* Mobile Navigation */}
            {isMenuOpen && (
                <Paper elevation={0} sx={{ display: { xs: 'block', md: 'none' }, borderTop: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                    <Stack spacing={1} sx={{ px: 2, pt: 2, pb: 2 }}>
                        {navigation.map((item) => (
                            <Box
                                key={item.name}
                                component={Link}
                                to={item.href}
                                sx={{
                                    display: 'block',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: isActive(item.href) ? '#7c3aed' : '#6b7280',
                                    background: isActive(item.href) ? '#ede9fe' : 'transparent',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s, color 0.2s',
                                    '&:hover': { background: '#f3f4f6', color: '#111827' }
                                }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Box>
                        ))}
                        <Box sx={{ pt: 2, borderTop: '1px solid #e5e7eb' }}>
                            <Button
                                variant='ghost'
                                component={Link}
                                to='/dashboard'
                                sx={{ width: '100%', justifyContent: 'flex-start', mb: 1 }}
                            >
                                <User style={{ width: 18, height: 18, marginRight: 8 }} />
                                Dashboard
                            </Button>
                            <Button
                                sx={{
                                    width: '100%',
                                    background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                    color: '#fff',
                                    '&:hover': { background: 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)' }
                                }}
                            >
                                Get Started
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            )}
        </AppBar>
    )
}

export default Header
