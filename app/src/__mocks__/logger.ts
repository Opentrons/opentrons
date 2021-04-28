// mock logger for tests
import path from 'path'
import type { Logger } from '../logger'

export function createLogger(filename: string): Logger {
  const label = path.relative(path.join(__dirname, '../../..'), filename)

  // @ts-expect-error
  return new Proxy(
    {},
    {
      get(_, level: string) {
        return (message: string, meta: unknown) =>
          console.log(`[${label}] ${level}: ${message} %j`, meta)
      },
    }
  )
}

export const useLogger = (filename: string): Logger => {
  return createLogger(filename)
}
