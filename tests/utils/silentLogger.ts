// eslint-disable-next-line n/no-missing-import
import { mock } from 'bun:test'
import type { Logger } from 'pino'

export const createSilentLogger = (): Logger =>
  ({
    info: mock(() => undefined),
    error: mock(() => undefined),
    warn: mock(() => undefined),
    debug: mock(() => undefined),
    trace: mock(() => undefined),
    fatal: mock(() => undefined),
    silent: mock(() => undefined),
    child: mock(() => createSilentLogger()),
    level: 'silent',
  }) as unknown as Logger
