import { useSelector } from 'react-redux'
import map from 'lodash/map'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getProtocolData } from '../../../redux/protocol'
import { getModuleRenderCoords } from '../utils/getModuleRenderCoords'
import { getAttachedModules } from '../../../redux/modules'
import { getConnectedRobot } from '../../../redux/discovery/selectors'
import type { State } from '../../../redux/types'

interface AttachedModulesEqualsProtocolModules {
  allModulesAttached: boolean | undefined
}
export function useAttachedModulesEqualsProtocolModules(): AttachedModulesEqualsProtocolModules {
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const protocolData = useSelector((state: State) => getProtocolData(state))
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )
  if (
    protocolData == null ||
    robot == null ||
    ('metadata' in protocolData && Object.keys(protocolData).length === 1)
  )
    return null as any
  const moduleRenderCoords = getModuleRenderCoords(
    protocolData,
    standardDeckDef as any
  )
  const robotName = robot.name
  const moduleModels = map(moduleRenderCoords, ({ moduleModel }) => moduleModel)
  const attachedModulesModels = map(attachedModules, ({ model }) => model)
  const hasADuplicateModuleAttached =
    new Set(attachedModulesModels).size !== attachedModulesModels.length
  const combinedModules = attachedModulesModels.concat(moduleModels)
  const uniqueModules = [...new Set(combinedModules)]
  const hasAttached = moduleModels.map(isAttached =>
    attachedModulesModels.some(module => module === isAttached && true)
  )
  let allModulesAttached = hasAttached.every(
    isModuleAttached => isModuleAttached === true
  )
  if (!hasADuplicateModuleAttached) {
    return { allModulesAttached }
  } else if (
    hasADuplicateModuleAttached &&
    attachedModulesModels.length - new Set(attachedModulesModels).size === 1
  ) {
    allModulesAttached =
      combinedModules.length - (uniqueModules.length + 1) ===
      moduleModels.length
    return { allModulesAttached }
  } else {
    allModulesAttached =
      combinedModules.length - (uniqueModules.length + 2) ===
      moduleModels.length
    return { allModulesAttached }
  }
}
