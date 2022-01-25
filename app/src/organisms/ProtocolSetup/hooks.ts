import { useContext, createContext } from 'react'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { checkModuleCompatibility } from '@opentrons/shared-data'
import { useProtocolDetails } from '../RunDetails/hooks'
import { useSelector } from 'react-redux'
import { State } from '../../redux/types'
import { getProtocolModulesInfo } from './utils/getProtocolModulesInfo'
import { getLabwareRenderInfo } from './utils/getLabwareRenderInfo'
import { getAttachedModules } from '../../redux/modules'
import { getConnectedRobotName } from '../../redux/robot/selectors'
import { AttachedModule } from '../../redux/modules/types'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'

import type { ProtocolModuleInfo } from './utils/getProtocolModulesInfo'
import type { LabwareRenderInfoById } from './utils/getLabwareRenderInfo'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface ProtocolMetadata {
  author?: string
  lastUpdated?: number | null
  description?: string | null
  creationMethod?: 'json' | 'python'
}

export function useProtocolMetadata(): ProtocolMetadata {
  const currentProtocolRun = useCurrentProtocolRun()
  const protocolMetadata = currentProtocolRun.protocolRecord?.data?.metadata
  const creationMethod = currentProtocolRun.protocolRecord?.data?.protocolType
  const author = protocolMetadata?.author
  const description = protocolMetadata?.description
  const lastUpdated = protocolMetadata?.lastModified

  return { author, lastUpdated, description, creationMethod }
}

interface ModuleRenderInfo extends ProtocolModuleInfo {
  attachedModuleMatch: AttachedModule | null
}
export function useModuleRenderInfoById(): {
  [moduleId: string]: ModuleRenderInfo
} {
  const { protocolData } = useProtocolDetails()
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )
  if (protocolData == null) return {}

  const protocolModulesInfo = getProtocolModulesInfo(
    protocolData,
    standardDeckDef as any
  )
  const protocolModulesInfoInLoadOrder = protocolModulesInfo.sort(
    (modA, modB) => modA.protocolLoadOrder - modB.protocolLoadOrder
  )
  let matchedAmod: AttachedModule[] = []
  const allModuleRenderInfo = protocolModulesInfoInLoadOrder.map(
    protocolMod => {
      const compatibleAttachedModule =
        attachedModules.find(
          attachedMod =>
            checkModuleCompatibility(
              attachedMod.model,
              protocolMod.moduleDef.model
            ) && !matchedAmod.find(m => m === attachedMod)
        ) ?? null
      if (compatibleAttachedModule !== null) {
        matchedAmod = [...matchedAmod, compatibleAttachedModule]
        return {
          ...protocolMod,
          attachedModuleMatch: compatibleAttachedModule,
        }
      }
      return {
        ...protocolMod,
        attachedModuleMatch: null,
      }
    }
  )
  return allModuleRenderInfo.reduce(
    (acc, moduleInfo) => ({
      ...acc,
      [moduleInfo.moduleId]: moduleInfo,
    }),
    {}
  )
}

export function useLabwareRenderInfoById(): LabwareRenderInfoById {
  const { protocolData } = useProtocolDetails()
  return protocolData != null
    ? getLabwareRenderInfo(protocolData, standardDeckDef as any)
    : {}
}

export function usePipetteMount(
  pipetteId: string
): LoadPipetteRunTimeCommand['params']['mount'] | null {
  const { protocolData } = useProtocolDetails()
  return (
    protocolData?.commands.find(
      (command: RunTimeCommand): command is LoadPipetteRunTimeCommand =>
        command.commandType === 'loadPipette' &&
        command.params.pipetteId === pipetteId
    )?.params.mount ?? null
  )
}

// this context is used to trigger an LPC success toast render from an LPC component lower in the tree
export const LPCSuccessToastContext = createContext<{
  setShowLPCSuccessToast: () => void
}>({ setShowLPCSuccessToast: () => null })

export function useLPCSuccessToast(): {
  setShowLPCSuccessToast: () => void
} {
  const { setShowLPCSuccessToast } = useContext(LPCSuccessToastContext)
  return { setShowLPCSuccessToast }
}
