import pino from 'pino'

export const getLogger = () =>
  pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  })
