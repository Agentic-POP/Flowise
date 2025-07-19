import { useState, useEffect } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

// project imports
import LeftPanel from './LeftPanel'
import MiddlePanel from './MiddlePanel'
import RightPanel from './RightPanel'

// ==============================|| CHAT LAYOUT ||============================== //

const ChatLayoutContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default
}))

const ChatLayout = ({ children }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

    // Responsive panel states
    const [leftPanelOpen, setLeftPanelOpen] = useState(!isMobile)
    const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile)

    // Panel widths based on screen size
    const getPanelWidths = () => {
        if (isMobile) {
            return {
                left: leftPanelOpen ? '100%' : '0px',
                middle: leftPanelOpen ? '0px' : rightPanelOpen ? '0px' : '100%',
                right: rightPanelOpen ? '100%' : '0px'
            }
        }

        if (isTablet) {
            return {
                left: '240px',
                middle:
                    leftPanelOpen && rightPanelOpen
                        ? 'calc(100% - 480px)'
                        : leftPanelOpen
                        ? 'calc(100% - 240px)'
                        : rightPanelOpen
                        ? 'calc(100% - 240px)'
                        : '100%',
                right: '240px'
            }
        }

        return {
            left: '280px',
            middle: '480px',
            right: 'calc(100% - 760px)'
        }
    }

    const panelWidths = getPanelWidths()

    // Handle panel toggles
    const toggleLeftPanel = () => setLeftPanelOpen(!leftPanelOpen)
    const toggleRightPanel = () => setRightPanelOpen(!rightPanelOpen)

    // Update panel states on screen size change
    useEffect(() => {
        setLeftPanelOpen(!isMobile)
        setRightPanelOpen(!isMobile)
    }, [isMobile])

    return (
        <ChatLayoutContainer>
            {/* Left Panel - Navigation & Projects */}
            <Box
                sx={{
                    width: panelWidths.left,
                    minWidth: isMobile ? 0 : 240,
                    maxWidth: isMobile ? '100%' : 320,
                    borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: theme.transitions.create(['width', 'transform'], {
                        duration: theme.transitions.duration.standard
                    }),
                    transform: isMobile && !leftPanelOpen ? 'translateX(-100%)' : 'translateX(0)',
                    position: isMobile ? 'absolute' : 'relative',
                    zIndex: isMobile ? 1200 : 1,
                    height: '100%',
                    backgroundColor: theme.palette.background.paper
                }}
            >
                <LeftPanel onToggle={toggleLeftPanel} isOpen={leftPanelOpen} />
            </Box>

            {/* Middle Panel - Chat Interface */}
            <Box
                sx={{
                    width: panelWidths.middle,
                    minWidth: isMobile ? 0 : 320,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: theme.transitions.create('width', {
                        duration: theme.transitions.duration.standard
                    }),
                    height: '100%',
                    backgroundColor: theme.palette.background.default
                }}
            >
                <MiddlePanel
                    onToggleLeft={toggleLeftPanel}
                    onToggleRight={toggleRightPanel}
                    leftPanelOpen={leftPanelOpen}
                    rightPanelOpen={rightPanelOpen}
                />
            </Box>

            {/* Right Panel - Canvas */}
            <Box
                sx={{
                    width: panelWidths.right,
                    minWidth: isMobile ? 0 : 240,
                    borderLeft: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: theme.transitions.create(['width', 'transform'], {
                        duration: theme.transitions.duration.standard
                    }),
                    transform: isMobile && !rightPanelOpen ? 'translateX(100%)' : 'translateX(0)',
                    position: isMobile ? 'absolute' : 'relative',
                    zIndex: isMobile ? 1200 : 1,
                    height: '100%',
                    backgroundColor: theme.palette.background.paper
                }}
            >
                <RightPanel onToggle={toggleRightPanel} isOpen={rightPanelOpen} />
            </Box>
        </ChatLayoutContainer>
    )
}

ChatLayout.propTypes = {
    children: PropTypes.node
}

export default ChatLayout
