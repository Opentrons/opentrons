import type { ProtocolFile as V3ProtocolFile } from './schemaV3'
import type { Command as V4Command, FileModule } from './schemaV4'

export interface MoveToWellParams {
  pipette: string
  labware: string
  well: string
  offset?: {
    x: number
    y: number
    z: number
  }
  minimumZHeight?: number
  forceDirect?: boolean
}

export type Command =
  | V4Command
  | {
      command: 'moveToWell'
      params: MoveToWellParams
    }

// NOTE: must be kept in sync with '../schemas/5.json'
export interface ProtocolFile<DesignerApplicationData>
  extends Omit<
    V3ProtocolFile<DesignerApplicationData>,
    'schemaVersion' | 'commands'
  > {
  $otSharedSchema: '#/protocol/schemas/5'
  schemaVersion: 5
  modules: Record<string, FileModule>
  commands: Command[]
}
