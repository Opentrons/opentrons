import type { ProtocolFile as V3ProtocolFile, AirGapParams } from './schemaV3'
import type { FileModule } from './schemaV4'
import type { Command as V5Command } from './schemaV5'
import type { DeckSlotId, PipetteMount as Mount } from '../../js/types'

export interface UpdateRobotStateParams {
  labware?: {
    [labwareId: string]: { slot: DeckSlotId }
  }
  modules?: {
    [moduleId: string]: { slot: DeckSlotId }
  }
  tipState?: {
    tipracks?: {
      [labwareId: string]: {
        [wellName: string]: boolean // true if tip is in there
      }
    }
    pipettes?: {
      [pipetteId: string]: boolean // true if pipette has tip(s)
    }
  }
  liquidState?: {
    pipettes?: {
      [pipetteId: string]: {
        /** tips are numbered 0-7. 0 is the furthest to the back of the robot.
         * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
         */
        [tipId: string]: { [ingredId: string]: { volume: number } }
      }
    }
    labware?: {
      [labwareId: string]: {
        [well: string]: { [ingredId: string]: { volume: number } }
      }
    }
  }
}

export type Command =
  | V5Command
  | {
      command: 'dispenseAirGap'
      params: AirGapParams
    }
  | {
      command: 'updateRobotState'
      params: UpdateRobotStateParams
    }

// NOTE: must be kept in sync with '../schemas/5.json'
export type ProtocolFile<
  DesignerApplicationData
> = V3ProtocolFile<DesignerApplicationData> & {
  $otSharedSchema: '#/protocol/schemas/5'
  schemaVersion: 6
  modules: Record<string, FileModule>
  commands: Command[]
}
