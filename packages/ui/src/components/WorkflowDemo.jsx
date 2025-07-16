import { useState } from 'react'
import { StyledButton as Button } from '../ui-component/button/StyledButton'
import { Plus, Play, Settings, Mail, Slack, Database, Calendar, FileText, Zap, ArrowRight } from 'lucide-react'

const WorkflowDemo = () => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [activeNode, setActiveNode] = useState(null)

    const nodes = [
        {
            id: '1',
            type: 'trigger',
            name: 'Gmail',
            icon: <Mail className='w-6 h-6' />,
            position: { x: 50, y: 100 },
            connected: true
        },
        {
            id: '2',
            type: 'condition',
            name: 'Filter',
            icon: <Settings className='w-6 h-6' />,
            position: { x: 250, y: 100 },
            connected: true
        },
        {
            id: '3',
            type: 'action',
            name: 'Slack',
            icon: <Slack className='w-6 h-6' />,
            position: { x: 450, y: 50 },
            connected: true
        },
        {
            id: '4',
            type: 'action',
            name: 'Database',
            icon: <Database className='w-6 h-6' />,
            position: { x: 450, y: 150 },
            connected: true
        }
    ]

    const playWorkflow = () => {
        setIsPlaying(true)
        nodes.forEach((node, index) => {
            setTimeout(() => {
                setActiveNode(node.id)
                if (index === nodes.length - 1) {
                    setTimeout(() => {
                        setActiveNode(null)
                        setIsPlaying(false)
                    }, 1000)
                }
            }, index * 1000)
        })
    }

    return (
        <div className='p-8 bg-gray-50 min-h-[500px] relative overflow-hidden'>
            {/* Toolbar */}
            <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center space-x-4'>
                    <Button onClick={playWorkflow} disabled={isPlaying} className='bg-green-600 hover:bg-green-700 text-white'>
                        <Play className='w-4 h-4 mr-2' />
                        {isPlaying ? 'Running...' : 'Execute Workflow'}
                    </Button>
                    <Button variant='outlined' size='small'>
                        <Plus className='w-4 h-4 mr-2' />
                        Add Node
                    </Button>
                </div>
                <div className='text-sm text-gray-500'>Workflow: Email to Team Notification</div>
            </div>

            {/* Workflow Canvas */}
            <div className='relative bg-white rounded-lg border-2 border-dashed border-gray-300 min-h-[400px] p-6'>
                {/* Grid background */}
                <div
                    className='absolute inset-0 opacity-30'
                    style={{
                        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                ></div>

                {/* Nodes */}
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                            activeNode === node.id ? 'scale-110 shadow-2xl' : 'scale-100 shadow-lg'
                        }`}
                        style={{ left: node.position.x, top: node.position.y }}
                    >
                        <div
                            className={`
              relative w-20 h-20 rounded-xl border-2 flex items-center justify-center cursor-pointer
              transition-all duration-300 hover:scale-105
              ${node.type === 'trigger' ? 'bg-green-100 border-green-300 text-green-700' : ''}
              ${node.type === 'condition' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : ''}
              ${node.type === 'action' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}
              ${activeNode === node.id ? 'ring-4 ring-purple-300 ring-opacity-50' : ''}
            `}
                        >
                            {node.icon}
                            {activeNode === node.id && (
                                <div className='absolute inset-0 border-2 border-purple-500 rounded-xl animate-pulse'></div>
                            )}
                        </div>
                        <div className='text-xs text-center mt-2 font-medium text-gray-700'>{node.name}</div>
                    </div>
                ))}

                {/* Connections */}
                <svg className='absolute inset-0 w-full h-full pointer-events-none'>
                    {/* Line from Gmail to Filter */}
                    <path
                        d='M 120 100 L 180 100'
                        stroke='#8b5cf6'
                        strokeWidth='2'
                        fill='none'
                        className={activeNode === '2' ? 'animate-pulse' : ''}
                    />
                    <ArrowRight className='absolute w-4 h-4 text-purple-600' style={{ left: 175, top: 92 }} />

                    {/* Line from Filter to Slack */}
                    <path
                        d='M 320 100 Q 360 80 380 50'
                        stroke='#8b5cf6'
                        strokeWidth='2'
                        fill='none'
                        className={activeNode === '3' ? 'animate-pulse' : ''}
                    />
                    <ArrowRight className='absolute w-4 h-4 text-purple-600' style={{ left: 375, top: 42 }} />

                    {/* Line from Filter to Database */}
                    <path
                        d='M 320 100 Q 360 120 380 150'
                        stroke='#8b5cf6'
                        strokeWidth='2'
                        fill='none'
                        className={activeNode === '4' ? 'animate-pulse' : ''}
                    />
                    <ArrowRight className='absolute w-4 h-4 text-purple-600' style={{ left: 375, top: 142 }} />
                </svg>

                {/* Add Node Suggestions */}
                <div className='absolute bottom-4 right-4 space-y-2'>
                    <div className='flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600'>
                        <Plus className='w-4 h-4' />
                        <span>Drag to add Calendar</span>
                        <Calendar className='w-4 h-4' />
                    </div>
                    <div className='flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600'>
                        <Plus className='w-4 h-4' />
                        <span>Drag to add Docs</span>
                        <FileText className='w-4 h-4' />
                    </div>
                </div>
            </div>

            {/* Workflow Description */}
            <div className='mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200'>
                <div className='flex items-start space-x-3'>
                    <Zap className='w-5 h-5 text-purple-600 mt-0.5' />
                    <div>
                        <h4 className='font-medium text-purple-900 mb-1'>How this workflow works:</h4>
                        <p className='text-sm text-purple-700'>
                            When a new email arrives in Gmail → Filter by subject keywords → Send notification to Slack channel AND save to
                            database for tracking
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkflowDemo
