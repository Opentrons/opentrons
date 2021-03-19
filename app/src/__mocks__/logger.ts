// mock logger for tests
import path from 'path'

export function createLogger(filename) {
  const label = path.relative(path.join(__dirname, '../../..'), filename)

  return new Proxy(
    {},
    {
      get(_, level) {
        return (message, meta) =>
          console.log(`[${label}] ${level}: ${message} %j`, meta)
      },
    }
  )
}

export const useLogger = filename => {
  return createLogger(filename)
}
