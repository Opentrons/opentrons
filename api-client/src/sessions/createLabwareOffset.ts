import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Session } from './types'

interface LabwareOffset {
  definitionUri: string
  location: { slot: string }
  vector: { x: number; y: number; z: number }
}

export interface CreateLabwareOffsetData {
  labwareOffsets: LabwareOffset[]
}

export function createLabwareOffset(
  config: HostConfig,
  runId: string,
  data: CreateLabwareOffsetData
): ResponsePromise<Session> {
  return request<Session, { data: CreateLabwareOffsetData }>(
    POST,
    `/runs/${runId}`,
    { data },
    config
  )
}
