import type {
  LabwareLocation,
  ModuleLocation,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

import type { ModuleModel, LabwareDefinition2 } from '@opentrons/shared-data'

export interface LabwareSetupItem {
  definition: LabwareDefinition2
  nickName: string | null
  initialLocation: LabwareLocation
  moduleModel: ModuleModel | null
  moduleLocation: ModuleLocation | null
}

export interface GroupedLabwareSetupItems {
  onDeckItems: LabwareSetupItem[]
  offDeckItems: LabwareSetupItem[]
}
