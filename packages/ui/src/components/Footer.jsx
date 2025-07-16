import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Github, Twitter, Linkedin, Youtube, Mail, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
    const footerLinks = {
        product: [
            { name: 'Workflow Builder', href: '/workflows' },
            { name: 'Integrations', href: '/integrations' },
            { name: 'Templates', href: '/templates' },
            { name: 'Pricing', href: '/pricing' },
            { name: 'Security', href: '/security' }
        ],
        resources: [
            { name: 'Documentation', href: '/docs' },
            { name: 'API Reference', href: '/api' },
            { name: 'Community', href: '/community' },
            { name: 'Blog', href: '/blog' },
            { name: 'Changelog', href: '/changelog' }
        ],
        company: [
            { name: 'About Us', href: '/about' },
            { name: 'Careers', href: '/careers' },
            { name: 'Contact', href: '/contact' },
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Terms of Service', href: '/terms' }
        ],
        support: [
            { name: 'Help Center', href: '/help' },
            { name: 'Status Page', href: '/status' },
            { name: 'Feature Requests', href: '/features' },
            { name: 'Bug Reports', href: '/bugs' },
            { name: 'Training', href: '/training' }
        ]
    }

    return (
        <Box component='footer' sx={{ background: '#111827', color: '#fff', mt: 8 }}>
            {/* Newsletter Section */}
            <Box sx={{ borderBottom: '1px solid #1f2937', py: 8 }}>
                <Box sx={{ maxWidth: '900px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, textAlign: 'center' }}>
                    <Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
                        Stay updated with automation tips
                    </Typography>
                    <Typography sx={{ color: '#9ca3af', mb: 3 }}>
                        Get the latest workflow automation tips, integration updates, and product news delivered to your inbox.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
                        <TextField
                            type='email'
                            placeholder='Enter your email'
                            variant='outlined'
                            size='medium'
                            sx={{
                                flex: 1,
                                input: { color: '#fff', background: '#1f2937', borderRadius: 2 },
                                '& .MuiOutlinedInput-root': {
                                    background: '#1f2937',
                                    borderRadius: 2,
                                    color: '#fff',
                                    border: '1px solid #374151',
                                    '& fieldset': { borderColor: '#374151' },
                                    '&:hover fieldset': { borderColor: '#7c3aed' },
                                    '&.Mui-focused fieldset': { borderColor: '#7c3aed' }
                                },
                                '& input::placeholder': { color: '#9ca3af' }
                            }}
                        />
                        <Button
                            sx={{
                                background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                color: '#fff',
                                px: 4,
                                borderRadius: 2,
                                fontWeight: 600,
                                '&:hover': { background: 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)' }
                            }}
                        >
                            Subscribe
                            <ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />
                        </Button>
                    </Stack>
                </Box>
            </Box>
            {/* Main Footer */}
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 10 }}>
                <Grid container spacing={6}>
                    {/* Brand */}
                    <Grid item xs={12} md={4} lg={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1
                                }}
                            >
                                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>BA</Typography>
                            </Box>
                            <Typography variant='h6' sx={{ fontWeight: 700, fontSize: 20 }}>
                                Behalf AI
                            </Typography>
                        </Box>
                        <Typography sx={{ color: '#9ca3af', mb: 3, fontSize: 15 }}>
                            The most powerful workflow automation platform for teams of all sizes. Connect your apps, automate your
                            processes, and scale your business.
                        </Typography>
                        <Stack direction='row' spacing={2}>
                            <button
                                type='button'
                                style={{ background: 'none', border: 'none', padding: 0, color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Github style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                type='button'
                                style={{ background: 'none', border: 'none', padding: 0, color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Twitter style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                type='button'
                                style={{ background: 'none', border: 'none', padding: 0, color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Linkedin style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                type='button'
                                style={{ background: 'none', border: 'none', padding: 0, color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Youtube style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                type='button'
                                style={{ background: 'none', border: 'none', padding: 0, color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Mail style={{ width: 20, height: 20 }} />
                            </button>
                        </Stack>
                    </Grid>
                    {/* Product Links */}
                    <Grid item xs={6} md={2}>
                        <Typography sx={{ fontWeight: 600, mb: 2 }}>Product</Typography>
                        <Stack spacing={1.5}>
                            {footerLinks.product.map((link, index) => (
                                <Link key={index} to={link.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 15 }}>
                                    {link.name}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>
                    {/* Resources Links */}
                    <Grid item xs={6} md={2}>
                        <Typography sx={{ fontWeight: 600, mb: 2 }}>Resources</Typography>
                        <Stack spacing={1.5}>
                            {footerLinks.resources.map((link, index) => (
                                <Link key={index} to={link.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 15 }}>
                                    {link.name}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>
                    {/* Company Links */}
                    <Grid item xs={6} md={2}>
                        <Typography sx={{ fontWeight: 600, mb: 2 }}>Company</Typography>
                        <Stack spacing={1.5}>
                            {footerLinks.company.map((link, index) => (
                                <Link key={index} to={link.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 15 }}>
                                    {link.name}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>
                    {/* Support Links */}
                    <Grid item xs={6} md={2}>
                        <Typography sx={{ fontWeight: 600, mb: 2 }}>Support</Typography>
                        <Stack spacing={1.5}>
                            {footerLinks.support.map((link, index) => (
                                <Link key={index} to={link.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 15 }}>
                                    {link.name}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
            {/* Bottom Bar */}
            <Box sx={{ borderTop: '1px solid #1f2937', py: 3 }}>
                <Box
                    sx={{
                        maxWidth: '1120px',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, lg: 4 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography sx={{ color: '#9ca3af', fontSize: 14 }}>© 2024 Behalf AI. All rights reserved.</Typography>
                    <Stack direction='row' spacing={3} sx={{ mt: { xs: 2, md: 0 } }}>
                        <Link to='/privacy' style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14 }}>
                            Privacy
                        </Link>
                        <Link to='/terms' style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14 }}>
                            Terms
                        </Link>
                        <Link to='/cookies' style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14 }}>
                            Cookies
                        </Link>
                    </Stack>
                </Box>
            </Box>
        </Box>
    )
}

export default Footer
