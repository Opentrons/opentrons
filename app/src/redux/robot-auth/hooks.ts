import { useSelector } from 'react-redux'

import { getRobotToken } from './slice'

import type { State } from '/app/redux/types'

export function useRobotToken(robotName: string | null): string | null {
  return useSelector((state: State) => getRobotToken(state, robotName))
}
