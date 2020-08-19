// @flow
import type { ProtocolFile as V3ProtocolFile, AirGapParams } from './schemaV3'
import type { FileModule } from './schemaV4'
import type { Command as V5Command } from './schemaV5'

export type Command =
  | V5Command
  | {| command: 'dispenseAirGap', params: AirGapParams |}

// NOTE: must be kept in sync with '../schemas/5.json'
// TODO IMMEDIATELY: figure this out
export type ProtocolFile<DesignerApplicationData> = {|
  ...V3ProtocolFile<DesignerApplicationData>,
  $otSharedSchema: '#/protocol/schemas/5',
  schemaVersion: 5,
  modules: {
    [moduleId: string]: FileModule,
  },
  commands: Array<Command>,
|}
