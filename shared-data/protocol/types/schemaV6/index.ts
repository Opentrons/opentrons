import type { ProtocolFile as V3ProtocolFile, AirGapParams } from './schemaV3'
import type { FileModule } from './schemaV4'
import type { V6Command } from './command'
import type { DeckSlotId, PipetteMount as Mount } from '../../js/types'

// NOTE: must be kept in sync with '../schemas/5.json'
export type ProtocolFile<
  DesignerApplicationData
> = V3ProtocolFile<DesignerApplicationData> & {
  $otSharedSchema: '#/protocol/schemas/6'
  schemaVersion: 6
  modules: Record<string, FileModule>
  commands: V6Command[]
}
