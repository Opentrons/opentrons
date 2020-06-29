// @flow
import * as actions from './actions'
import { type RootState, rootReducer } from './reducers'
import * as selectors from './selectors'

type HintKey =
  // normal hints
  | 'add_liquids_and_labware'
  | 'deck_setup_explanation'
  | 'module_without_labware'
  | 'thermocycler_lid_passive_cooling'
  // blocking hints
  | 'custom_labware_with_modules'
  | 'export_v4_protocol_3_18'
  | 'change_magnet_module_model'

// DEPRECATED HINTS (keep a record to avoid name collisions with old persisted dismissal states)
// 'export_v4_protocol'

export { actions, rootReducer, selectors }

export type { RootState, HintKey }
