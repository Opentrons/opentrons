import { RobotUpdateContext } from './RobotUpdateContext'
import { useRobotUpdateOrchestrator } from './useRobotUpdateOrchestrator'

import type { ReactNode } from 'react'

export interface RobotUpdateProviderProps {
  children: ReactNode
}

/**
 * Root provider that owns the robot software update apply-flow orchestrator.
 */
export function RobotUpdateProvider({
  children,
}: RobotUpdateProviderProps): JSX.Element {
  const { startUpdate } = useRobotUpdateOrchestrator()

  return (
    <RobotUpdateContext.Provider value={{ startUpdate }}>
      {children}
    </RobotUpdateContext.Provider>
  )
}
