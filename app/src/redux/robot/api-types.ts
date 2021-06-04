//
import { TEMPDECK, MAGDECK, THERMOCYCLER } from '@opentrons/shared-data'

import type { ModuleModel } from '@opentrons/shared-data'

export type Slot =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'

export interface ApiSessionModule {
  // resource ID
  _id: number
  // slot module is installed in
  slot: Slot
  // name identifier of the module
  name: typeof TEMPDECK | typeof MAGDECK | typeof THERMOCYCLER
  model: ModuleModel
  protocolLoadOrder: number
}

export interface ApiSessionModuleLegacy {
  // resource ID
  _id: number
  // slot module is installed in
  slot: Slot
  // name identifier of the module
  name: typeof TEMPDECK | typeof MAGDECK | typeof THERMOCYCLER
}
