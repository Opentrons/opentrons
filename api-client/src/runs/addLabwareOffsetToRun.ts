import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  LabwareOffset,
  LabwareOffsetCreateData,
  LegacyLabwareOffsetCreateData,
} from './types'

export function addLabwareOffsetToRun(
  config: HostConfig,
  runId: string,
  data: LegacyLabwareOffsetCreateData | LabwareOffsetCreateData,
  userNotes: string
): ResponsePromise<LabwareOffset>
export function addLabwareOffsetToRun(
  config: HostConfig,
  runId: string,
  data: LegacyLabwareOffsetCreateData[] | LabwareOffsetCreateData[],
  userNotes: string
): ResponsePromise<LabwareOffset[]>
export function addLabwareOffsetToRun(
  config: HostConfig,
  runId: string,
  data:
    | LegacyLabwareOffsetCreateData
    | LegacyLabwareOffsetCreateData[]
    | LabwareOffsetCreateData
    | LabwareOffsetCreateData[],
  userNotes: string
): ResponsePromise<LabwareOffset | LabwareOffset[]> {
  return request<
    LabwareOffset | LabwareOffset[],
    {
      data:
        | LegacyLabwareOffsetCreateData
        | LegacyLabwareOffsetCreateData[]
        | LabwareOffsetCreateData
        | LabwareOffsetCreateData[]
    }
  >(POST, `/runs/${runId}/labware_offsets`, config, {
    body: { data },
    userNotes,
  })
}
