import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

const workflows = [
    { id: 'email-to-slack', title: 'Email to Slack Notification', description: 'Send Slack notifications for new emails.' },
    { id: 'form-to-database', title: 'Form to Database', description: 'Save form submissions to your database.' },
    { id: 'calendar-reminder', title: 'Calendar Reminder', description: 'Create reminders from calendar events.' }
]

export default function WorkflowsPage() {
    return (
        <Container maxWidth='lg' sx={{ mx: 'auto', px: 2, py: 6 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 4 }}>
                Workflows
            </Typography>
            <Grid container spacing={4}>
                {workflows.map((wf) => (
                    <Grid item xs={12} sm={6} md={4} key={wf.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent>
                                <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                                    {wf.title}
                                </Typography>
                                <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
                                    {wf.description}
                                </Typography>
                                <Button component={Link} to={`/workflows/${wf.id}`} variant='outlined'>
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    )
}
