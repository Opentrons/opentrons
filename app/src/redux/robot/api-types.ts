// @flow
//
import {
  typeof TEMPDECK,
  typeof MAGDECK,
  typeof THERMOCYCLER,
  type ModuleModel,
} from '@opentrons/shared-data'

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

export type ApiSessionModule = {|
  // resource ID
  _id: number,
  // slot module is installed in
  slot: Slot,
  // name identifier of the module
  name: TEMPDECK | MAGDECK | THERMOCYCLER,
  model: ModuleModel,
|}

export type ApiSessionModuleLegacy = {|
  // resource ID
  _id: number,
  // slot module is installed in
  slot: Slot,
  // name identifier of the module
  name: TEMPDECK | MAGDECK | THERMOCYCLER,
|}
