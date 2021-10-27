/* NOTE: this file is only necessary until step-generation and protocol-designer
 * implement protocol schema V6. This file was orginally created when it was decided
 * that certain features of V6 schema were needed, but the actual making of said schema
 * was punted. Now that schema V6 does exist, this intermediate type that SG and PD support
 * can be phased out as the two are updated to the V6 schema support.
 */

import type { ProtocolFile as V3ProtocolFile, AirGapParams } from './schemaV3'
import type { FileModule } from './schemaV4'
import type { Command as V5Command } from './schemaV5'

export type Command =
  | V5Command
  | {
      command: 'dispenseAirGap'
      params: AirGapParams
    }

// NOTE: must be kept in sync with '../schemas/5.json'
export type ProtocolFile<
  DesignerApplicationData
> = V3ProtocolFile<DesignerApplicationData> & {
  $otSharedSchema: '#/protocol/schemas/5'
  schemaVersion: 5
  modules: Record<string, FileModule>
  commands: Command[]
}
