import { useSelector } from 'react-redux'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import {
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../redux/protocol'
import { useProtocolDetails } from '../RunDetails/hooks'
import { getModuleRenderInfo } from './utils/getModuleRenderInfo'
import { getLabwareRenderInfo } from './utils/getLabwareRenderInfo'

import type { ModuleRenderInfoById } from './utils/getModuleRenderInfo'
import type { LabwareRenderInfoById } from './utils/getLabwareRenderInfo'
import type { State } from '../../redux/types'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LoadPipetteCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
interface ProtocolMetadata {
  author: string | null
  lastUpdated: number | null
  method: string | null
  description: string | null
}

export function useProtocolMetadata(): ProtocolMetadata {
  const author = useSelector((state: State) => getProtocolAuthor(state))
  const lastUpdated = useSelector((state: State) =>
    getProtocolLastUpdated(state)
  )
  const method = useSelector((state: State) => getProtocolMethod(state))
  const description = useSelector((state: State) =>
    getProtocolDescription(state)
  )
  return { author, lastUpdated, method, description }
}

export function useModuleRenderInfoById(): ModuleRenderInfoById {
  const { protocolData } = useProtocolDetails()
  return protocolData != null
    ? getModuleRenderInfo(protocolData, standardDeckDef as any)
    : {}
}

export function useLabwareRenderInfoById(): LabwareRenderInfoById {
  const { protocolData } = useProtocolDetails()
  return protocolData != null
    ? getLabwareRenderInfo(protocolData, standardDeckDef as any)
    : {}
}

export function usePipetteMount(
  pipetteId: string
): LoadPipetteCommand['params']['mount'] | null {
  const { protocolData } = useProtocolDetails()
  return (
    protocolData?.commands.find(
      (command: Command): command is LoadPipetteCommand =>
        command.commandType === 'loadPipette' &&
        command.params.pipetteId === pipetteId
    )?.params.mount ?? null
  )
}
