import { useSelector } from 'react-redux'

import { useInterval } from '@opentrons/components'

import { fetchModules, getAttachedModules } from '../../../redux/modules'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { AttachedModule } from '../../../redux/modules/types'
import type { State } from '../../../redux/types'

const POLL_MODULE_INTERVAL_MS = 5000

export function useAttachedModules(robotName: string | null): AttachedModule[] {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  useInterval(
    () => robotName != null && dispatchRequest(fetchModules(robotName)),
    POLL_MODULE_INTERVAL_MS,
    true
  )

  return attachedModules
}
