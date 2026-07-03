import { POST, request } from '../request'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export interface CreateLabwareDefinitionResponsePayload {
  definitionUri: string
}

export function createLabwareDefinition(
  config: HostConfig,
  runId: string,
  data: LabwareDefinition
): ResponsePromise<CreateLabwareDefinitionResponsePayload> {
  return request<
    CreateLabwareDefinitionResponsePayload,
    { data: LabwareDefinition }
  >(POST, `/runs/${runId}/labware_definitions`, config, { body: { data } })
}
