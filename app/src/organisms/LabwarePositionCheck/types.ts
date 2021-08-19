import { SECTIONS } from './constants'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'

export interface LabwarePositionCheckCommand {
  labwareId: string
  section: keyof typeof SECTIONS
  commands: Command[]
}
