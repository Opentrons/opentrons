import React from 'react'
import { useSelector } from 'react-redux'

import { fetchModules, getAttachedModules } from '../../redux/modules'
import { fetchPipettes, getAttachedPipettes } from '../../redux/pipettes'
import { useDispatchApiRequest } from '../../redux/robot-api'

import type { AttachedModule } from '../../redux/modules/types'
import type { AttachedPipettesByMount } from '../../redux/pipettes/types'
import type { State } from '../../redux/types'

export function useAttachedModules(robotName: string | null): AttachedModule[] {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchModules(robotName))
    }
  }, [dispatchRequest, robotName])

  return attachedModules
}

export function useAttachedPipettes(
  robotName: string | null
): AttachedPipettesByMount {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedPipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipettes(robotName))
    }
  }, [dispatchRequest, robotName])

  return attachedPipettes
}
