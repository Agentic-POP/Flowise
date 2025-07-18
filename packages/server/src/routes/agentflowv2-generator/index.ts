import express from 'express'
import agentflowv2GeneratorController from '../../controllers/agentflowv2-generator'
const router = express.Router()

// Debug logging middleware
router.use((req, res, next) => {
    console.log('agentflowv2-generator router hit', req.method, req.path, req.body)
    next()
})

router.post('/generate', agentflowv2GeneratorController.generateAgentflowv2)

export default router
