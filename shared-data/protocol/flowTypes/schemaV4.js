// @flow
import type { DeckSlotId } from '@opentrons/shared-data'
import type { ProtocolFile as V3ProtocolFile } from './schemaV3'
export type { Command, FilePipette, FileLabware } from './schemaV3'

export type FileModule = {|
  slot: DeckSlotId,
  moduleType: string, // see spec for enum
  model: string,
|}

// NOTE: must be kept in sync with '../schemas/4.json'
export type ProtocolFile<DesignerApplicationData> = {|
  ...V3ProtocolFile<DesignerApplicationData>,
  schemaVersion: 4,
  // TODO: Ian 2019-11-11 make modules a required key when v4 is legit
  modules?: {
    [moduleId: string]: FileModule,
  },
|}
