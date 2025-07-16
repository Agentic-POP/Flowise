import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function IntegrationDetails() {
    const { id } = useParams()
    return (
        <Container maxWidth='sm' sx={{ mx: 'auto', px: 2, py: 6 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 2 }}>
                {id.charAt(0).toUpperCase() + id.slice(1)} Integration
            </Typography>
            <Typography variant='subtitle1' sx={{ color: 'text.secondary', mb: 4 }}>
                This is a placeholder for the {id} integration details. Add more info, screenshots, and setup instructions here.
            </Typography>
        </Container>
    )
}
