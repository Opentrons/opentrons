import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useProtocolDetails } from '../RunDetails/hooks'
import { getModuleRenderInfo } from './utils/getModuleRenderInfo'
import { getLabwareRenderInfo } from './utils/getLabwareRenderInfo'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'

import type { ModuleRenderInfoById } from './utils/getModuleRenderInfo'
import type { LabwareRenderInfoById } from './utils/getLabwareRenderInfo'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LoadPipetteCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

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

// NOTE: this hook should be deleted once we have a better identifier to look up labware offsets
// for now, this mapper will just strip the "id" out of labwareDefinitionIds so consumers don't need to worry
// about the concept of labwareDefinitionIds vs labwareDefinitionUris
export function useLabwareDefinitionUri(labwareId: string): string {
  const { protocolData } = useProtocolDetails()
  const labwareDefinitionId = protocolData?.labware[labwareId].definitionId
  if (labwareDefinitionId == null) {
    throw new Error(
      'expected to be able to find labware definition id for labware, but could not'
    )
  }
  return labwareDefinitionId.substring(0, labwareDefinitionId.length - 3)
}
