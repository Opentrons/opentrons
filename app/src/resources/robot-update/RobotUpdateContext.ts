import { createContext, useContext } from 'react'

export interface RobotUpdateContextValue {
  startUpdate: (robotName: string, systemFile?: string) => void
}

export const RobotUpdateContext = createContext<RobotUpdateContextValue | null>(
  null
)

export function useRobotUpdateContext(): RobotUpdateContextValue {
  const value = useContext(RobotUpdateContext)
  if (value == null) {
    throw new Error(
      'useRobotUpdateContext must be used within RobotUpdateProvider'
    )
  }
  return value
}
