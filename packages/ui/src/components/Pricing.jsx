import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import { Check, X, Zap, Crown, Building, ArrowRight } from 'lucide-react'

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(false)

    const plans = [
        {
            name: 'Starter',
            icon: <Zap className='w-6 h-6' />,
            monthlyPrice: 0,
            annualPrice: 0,
            description: 'Perfect for individuals getting started with automation',
            features: [
                '5 active workflows',
                '1,000 workflow executions/month',
                '100+ integrations',
                'Email support',
                'Community templates',
                'Basic analytics'
            ],
            limitations: ['No custom code nodes', 'No team collaboration', 'No advanced security'],
            cta: 'Start for free',
            popular: false
        },
        {
            name: 'Pro',
            icon: <Crown className='w-6 h-6' />,
            monthlyPrice: 20,
            annualPrice: 200,
            description: 'For growing teams that need more power and flexibility',
            features: [
                'Unlimited workflows',
                '10,000 workflow executions/month',
                '400+ integrations',
                'Priority support',
                'All templates',
                'Advanced analytics',
                'Custom code nodes',
                'Team collaboration (5 seats)',
                'Version control',
                'Custom domains'
            ],
            limitations: ['Limited enterprise features'],
            cta: 'Start 14-day free trial',
            popular: true
        },
        {
            name: 'Enterprise',
            icon: <Building className='w-6 h-6' />,
            monthlyPrice: 50,
            annualPrice: 500,
            description: 'For large organizations with advanced security and compliance needs',
            features: [
                'Everything in Pro',
                'Unlimited executions',
                'Unlimited team members',
                'SSO & SAML',
                'Advanced security controls',
                'On-premise deployment',
                'Dedicated support',
                'SLA guarantees',
                'Custom integrations',
                'Advanced audit logs',
                'Priority feature requests'
            ],
            limitations: [],
            cta: 'Contact sales',
            popular: false
        }
    ]

    return (
        <Box sx={{ py: 12, background: '#f9fafb' }}>
            <Box sx={{ maxWidth: '1120px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant='h3' sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: { xs: 28, md: 36 } }}>
                        Simple, transparent pricing
                    </Typography>
                    <Typography variant='h6' sx={{ color: '#4b5563', maxWidth: 600, mx: 'auto', fontSize: 20, fontWeight: 400, mb: 4 }}>
                        Start free, scale as you grow. No hidden fees, no surprises.
                    </Typography>
                    {/* Billing Toggle */}
                    <Stack direction='row' spacing={2} alignItems='center' justifyContent='center' sx={{ mb: 4 }}>
                        <Typography variant='body2' sx={{ color: !isAnnual ? '#111827' : '#6b7280', fontWeight: !isAnnual ? 600 : 400 }}>
                            Monthly
                        </Typography>
                        <Switch
                            checked={isAnnual}
                            onChange={() => setIsAnnual(!isAnnual)}
                            color='secondary'
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#7c3aed'
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)'
                                }
                            }}
                        />
                        <Typography variant='body2' sx={{ color: isAnnual ? '#111827' : '#6b7280', fontWeight: isAnnual ? 600 : 400 }}>
                            Annual
                        </Typography>
                        <Box
                            sx={{
                                fontSize: 13,
                                color: '#16a34a',
                                background: '#dcfce7',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                fontWeight: 500
                            }}
                        >
                            Save 17%
                        </Box>
                    </Stack>
                </Box>
                {/* Pricing Cards */}
                <Grid container spacing={4} sx={{ mb: 8 }}>
                    {plans.map((plan, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper
                                elevation={plan.popular ? 8 : 2}
                                sx={{
                                    position: 'relative',
                                    background: '#fff',
                                    border: plan.popular ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                    borderRadius: 4,
                                    p: 4,
                                    transition: 'all 0.3s',
                                    boxShadow: plan.popular ? 8 : 2,
                                    transform: plan.popular ? 'scale(1.05)' : 'none',
                                    '&:hover': {
                                        borderColor: '#a78bfa',
                                        boxShadow: 10
                                    },
                                    height: '100%'
                                }}
                            >
                                {plan.popular && (
                                    <Box sx={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                                        <Box
                                            sx={{
                                                background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                                                color: '#fff',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                px: 3,
                                                py: 0.5,
                                                borderRadius: 2
                                            }}
                                        >
                                            Most Popular
                                        </Box>
                                    </Box>
                                )}
                                {/* Header */}
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            p: 1.5,
                                            borderRadius: 3,
                                            mb: 2,
                                            background: plan.popular ? '#ede9fe' : '#f3f4f6',
                                            color: plan.popular ? '#7c3aed' : '#6b7280'
                                        }}
                                    >
                                        {plan.icon}
                                    </Box>
                                    <Typography variant='h6' sx={{ fontWeight: 700, color: '#111827', mb: 1, fontSize: 22 }}>
                                        {plan.name}
                                    </Typography>
                                    <Typography variant='body2' sx={{ color: '#6b7280', mb: 2 }}>
                                        {plan.description}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography
                                            variant='h3'
                                            sx={{ fontWeight: 700, color: '#111827', fontSize: 32, display: 'inline' }}
                                        >
                                            ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: '#6b7280', ml: 1, display: 'inline' }}>
                                            /{isAnnual ? 'year' : 'month'}
                                        </Typography>
                                    </Box>
                                    <Button
                                        fullWidth
                                        sx={{
                                            background: plan.popular ? 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)' : '#fff',
                                            color: plan.popular ? '#fff' : '#7c3aed',
                                            border: plan.popular ? 'none' : '1px solid #e5e7eb',
                                            fontWeight: 600,
                                            py: 1.5,
                                            mt: 1,
                                            mb: 1,
                                            '&:hover': {
                                                background: plan.popular ? 'linear-gradient(90deg, #6d28d9 0%, #1d4ed8 100%)' : '#ede9fe',
                                                color: plan.popular ? '#fff' : '#7c3aed'
                                            }
                                        }}
                                        endIcon={
                                            plan.name !== 'Enterprise' ? (
                                                <ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />
                                            ) : null
                                        }
                                    >
                                        {plan.cta}
                                    </Button>
                                </Box>
                                {/* Features */}
                                <Stack spacing={1.5} sx={{ mb: 2 }}>
                                    {plan.features.map((feature, featureIndex) => (
                                        <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Check style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                                            <Typography variant='body2' sx={{ color: '#374151' }}>
                                                {feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {plan.limitations.map((limitation, limitationIndex) => (
                                        <Box key={limitationIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <X style={{ width: 18, height: 18, color: '#9ca3af', flexShrink: 0 }} />
                                            <Typography variant='body2' sx={{ color: '#6b7280' }}>
                                                {limitation}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                {/* FAQ */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='h6' sx={{ fontWeight: 700, color: '#111827', mb: 2, fontSize: 20 }}>
                        Frequently asked questions
                    </Typography>
                    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'left' }}>
                        <Box component='details' sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2, mb: 2 }}>
                            <Box component='summary' sx={{ fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                                Can I change plans anytime?
                            </Box>
                            <Typography sx={{ mt: 1, color: '#6b7280', fontSize: 15 }}>
                                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                            </Typography>
                        </Box>
                        <Box component='details' sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2, mb: 2 }}>
                            <Box component='summary' sx={{ fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                                What happens if I exceed my execution limit?
                            </Box>
                            <Typography sx={{ mt: 1, color: '#6b7280', fontSize: 15 }}>
                                Your workflows will pause until the next billing cycle. You can upgrade anytime to increase your limits.
                            </Typography>
                        </Box>
                        <Box component='details' sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2, mb: 2 }}>
                            <Box component='summary' sx={{ fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                                Do you offer a free trial for paid plans?
                            </Box>
                            <Typography sx={{ mt: 1, color: '#6b7280', fontSize: 15 }}>
                                Yes, all paid plans include a 14-day free trial with full access to all features.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default Pricing
