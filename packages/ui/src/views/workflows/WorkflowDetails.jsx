import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import WorkflowDemo from '@/components/WorkflowDemo'

export default function WorkflowDetails() {
    // In a real app, fetch workflow details by ID from route params
    return (
        <Container maxWidth='md' sx={{ mx: 'auto', px: 2, py: 6 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 2 }}>
                Workflow Title (Example)
            </Typography>
            <Typography variant='subtitle1' sx={{ color: 'text.secondary', mb: 4 }}>
                This is a detailed description of the workflow. In production, fetch this by ID from the backend.
            </Typography>
            <WorkflowDemo />
        </Container>
    )
}
