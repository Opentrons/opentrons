// protocol type defs
import type {
  JsonProtocolFile,
  ProtocolFileV1,
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'

import type { Mount } from '../pipettes/types'

import { TYPE_JSON, TYPE_PYTHON, TYPE_ZIP } from './constants'

export type PythonProtocolMetadata = ProtocolFileV1<{
  [key: string]: unknown
}> & {
  source?: string
  [key: string]: unknown
}

// data may be a full JSON protocol or just a metadata dict from Python
// NOTE: add union of additional versions after schema is bumped
export type ProtocolData =
  | JsonProtocolFile
  | { metadata: PythonProtocolMetadata }

export type ProtocolType =
  | typeof TYPE_JSON
  | typeof TYPE_PYTHON
  | typeof TYPE_ZIP

export interface ProtocolFile {
  name: string
  type: ProtocolType | null | undefined
  lastModified: number | null | undefined
  [key: string]: unknown
}

// action types

export interface OpenProtocolAction {
  type: 'protocol:OPEN'
  payload: { file: ProtocolFile }
}

export interface UploadProtocolAction {
  type: 'protocol:UPLOAD'
  payload: { contents: string; data: ProtocolData | null }
  // TODO(bc, 2021-06-11): remove robot boolean key from meta, unused?
  meta: { robot: true }
}
export interface LoadProtocolAction {
  type: 'protocol:LOAD'
  payload: { file: ProtocolFile; data: ProtocolData | null }
}

export interface CloseProtocolAction {
  type: 'protocol:CLOSE'
}

export interface InvalidProtocolFileAction {
  type: 'protocol:INVALID_FILE'
  payload: { file: ProtocolFile; message: string }
}

export interface ProtocolPipetteTiprackData {
  pipetteSpecs: PipetteNameSpecs | null
  tipRackDefs: LabwareDefinition2[]
}

export type ProtocolPipetteTipRackByMount = {
  [mount in Mount]: null | ProtocolPipetteTiprackData
}

export type ProtocolAction =
  | OpenProtocolAction
  | UploadProtocolAction
  | InvalidProtocolFileAction
  | LoadProtocolAction
  | CloseProtocolAction

// state types

export interface ProtocolState {
  readonly file: ProtocolFile | null
  readonly contents: string | null
  readonly data: ProtocolData | null
}
