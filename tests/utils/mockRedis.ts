export class MockRedis {
  private data = new Map<string, string>()
  private ttls = new Map<string, number>()
  private isConnected = true

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.data.get(key) ?? null)
  }

  set(key: string, value: string, ex?: 'EX', ttl?: number): Promise<'OK'> {
    this.data.set(key, value)
    if (ex === 'EX' && ttl !== undefined) {
      this.ttls.set(key, ttl)
    }
    return Promise.resolve('OK')
  }

  getTtl(key: string): number | undefined {
    return this.ttls.get(key)
  }

  del(...keys: string[]): Promise<number> {
    let count = 0
    for (const key of keys) {
      const deleted = this.data.delete(key)
      this.ttls.delete(key)
      count = deleted ? count + 1 : count
    }
    return Promise.resolve(count)
  }

  quit(): Promise<'OK'> {
    this.isConnected = false
    this.data.clear()
    this.ttls.clear()
    return Promise.resolve('OK')
  }

  flushall(): Promise<'OK'> {
    this.data.clear()
    this.ttls.clear()
    return Promise.resolve('OK')
  }

  keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    )
    return Promise.resolve(
      Array.from(this.data.keys()).filter((k) => regex.test(k)),
    )
  }
}

export const createMockRedis = (): MockRedis => new MockRedis()
