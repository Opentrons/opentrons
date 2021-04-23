// mock logger for tests
import path from 'path'

export function createLogger(
  filename: string
): (message: string, meta: unknown) => void {
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

export const useLogger = (
  filename: string
): ((message: string, meta: unknown) => void) => {
  return createLogger(filename)
}
