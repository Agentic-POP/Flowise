import { Outlet } from 'react-router-dom'
import { Box, useTheme } from '@mui/material'

// project imports
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// ==============================|| AUTH LAYOUT ||============================== //

const AuthLayout = () => {
    const theme = useTheme()

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Header />

            {/* Main Content - Centered Auth Forms */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    [theme.breakpoints.down(1367)]: {
                        alignItems: 'start',
                        overflowY: 'auto',
                        py: '64px'
                    }
                }}
            >
                <Outlet />
            </Box>

            {/* Footer */}
            <Footer />
        </Box>
    )
}

export default AuthLayout
