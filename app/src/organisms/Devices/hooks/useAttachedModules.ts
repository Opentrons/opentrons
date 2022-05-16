import * as React from 'react'
import { useSelector } from 'react-redux'

import { fetchModules, getAttachedModules } from '../../../redux/modules'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { AttachedModule } from '../../../redux/modules/types'
import type { State } from '../../../redux/types'

// TODO: immediately move this to the react-api-client
export function useAttachedModules(robotName: string | null): AttachedModule[] {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  React.useEffect(() => {
    robotName != null && dispatchRequest(fetchModules(robotName))
  }, [robotName])

  return attachedModules
}
