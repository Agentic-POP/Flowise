import { Box } from '@mui/material'
import AgentflowCanvas from '../agentflowsv2/Canvas'

export default function Chat() {
    return (
        <Box sx={{ height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
            <AgentflowCanvas />
        </Box>
    )
}
