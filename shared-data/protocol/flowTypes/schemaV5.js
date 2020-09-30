// @flow
import type { ProtocolFile as V3ProtocolFile } from './schemaV3'
import type { Command as V4Command, FileModule } from './schemaV4'

export type MoveToWellParams = {|
  pipette: string,
  labware: string,
  well: string,
  offset?: {
    x: number,
    y: number,
    z: number,
  },
  minimumZHeight?: number,
  forceDirect?: boolean,
|}

export type Command =
  | V4Command
  | {| command: 'moveToWell', params: MoveToWellParams |}

// NOTE: must be kept in sync with '../schemas/5.json'
export type ProtocolFile<DesignerApplicationData> = {|
  ...V3ProtocolFile<DesignerApplicationData>,
  $otSharedSchema: '#/protocol/schemas/5',
  schemaVersion: 5,
  modules: {
    [moduleId: string]: FileModule,
  },
  commands: Array<Command>,
|}
