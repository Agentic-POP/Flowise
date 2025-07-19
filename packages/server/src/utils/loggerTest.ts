import logger from './logger'

logger.info('[logger-test]: This is an info log. It should always appear if LOG_LEVEL is info or lower.')
logger.debug('[logger-test]: This is a debug log. It only appears if LOG_LEVEL=debug.')
logger.warn('[logger-test]: This is a warning log. It should always appear if LOG_LEVEL is warn or lower.')
logger.error('[logger-test]: This is an error log. It should always appear.')

console.log(
    '[logger-test]: If you see all four log lines above in your console, your logger is working and LOG_LEVEL is set to debug. If you only see info/warn/error, LOG_LEVEL is info. If you only see warn/error, LOG_LEVEL is warn. If you only see error, LOG_LEVEL is error.'
)
