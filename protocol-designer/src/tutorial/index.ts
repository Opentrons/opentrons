import * as actions from './actions'
import { rootReducer } from './reducers'
import * as selectors from './selectors'

import type { RootState } from './reducers'

type HintParams =
  // normal hints
  | { hintKey: 'thermocycler_lid_passive_cooling' }
  | { hintKey: 'wait_for_heater_shaker_temp'; targetTemperature: number }
  | { hintKey: 'wait_for_temperature_module_temp'; targetTemperature: number }
  | { hintKey: 'wait_for_thermocycler_block_temp'; targetTemperature: number }
  | { hintKey: 'wait_for_thermocycler_lid_temp'; targetTemperature: number }
  | { hintKey: 'wait_for_thermocycler_profile' }
  | { hintKey: 'waste_chute_warning' }
  // blocking hints
  | { hintKey: 'change_magnet_module_model' }
  | { hintKey: 'has_errors' }
  | { hintKey: 'no_commands' }

type HintKey = HintParams['hintKey']

// DEPRECATED HINTS (keep a record to avoid name collisions with old persisted dismissal states)
// | 'export_v4_protocol'
// | 'export_v4_protocol_3_18'
// | 'export_v5_protocol_3_20'
// | 'export_v6_protocol_6_10'
// | 'export_v6_protocol_6_20'
// | 'export_v7_protocol_7_0'
// | 'export_v8_protocol_7_1'
// | 'custom_labware_with_modules'
// | 'export_v8_1_protocol_7_3'
// | 'protocol_can_enter_batch_edit'
// | 'multiple_modules_without_labware'
// | 'add_liquids_and_labware'
// | 'deck_setup_explanation'
// | 'module_without_labware'
// | 'unused_hardware'

export { actions, rootReducer, selectors }
export type { RootState, HintParams, HintKey }
