import { useSelector } from 'react-redux'

import { getRobotModelByName, RE_ROBOT_MODEL_OT3 } from '/app/redux/discovery'

import type { State } from '/app/redux/types'

export function useIsFlex(robotName: string): boolean {
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  return RE_ROBOT_MODEL_OT3.test(robotModel ?? '')
}
