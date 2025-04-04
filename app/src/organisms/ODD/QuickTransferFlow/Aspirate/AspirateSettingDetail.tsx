import { FlowRateEntry } from '../QuickTransferAdvancedSettings/FlowRate'
import { TipPositionEntry } from '../QuickTransferAdvancedSettings/TipPosition'
import { Mix } from '../QuickTransferAdvancedSettings/Mix'
import { Delay } from '../QuickTransferAdvancedSettings/Delay'
import { TouchTip } from '../QuickTransferAdvancedSettings/TouchTip'
import { AirGap } from '../QuickTransferAdvancedSettings/AirGap'
import type { Dispatch } from 'react'
import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

// ToDo(kk:04/03/2025) add pre-wet tip
const SETTING_OPTIONS = {
  ASPIRATE_FLOW_RATE: 'aspirate_flow_rate',
  ASPIRATE_TIP_POSITION: 'aspirate_tip_position',
  ASPIRATE_MIX: 'aspirate_mix',
  ASPIRATE_DELAY: 'aspirate_delay',
  ASPIRATE_TOUCH_TIP: 'aspirate_touch_tip',
  ASPIRATE_AIR_GAP: 'aspirate_air_gap',
} as const

interface AspirateSettingDetailProps {
  selectedSetting: string | null
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  onBack: () => void
}

export function AspirateSettingDetail(
  props: AspirateSettingDetailProps
): JSX.Element | null {
  const { selectedSetting, state, dispatch, onBack } = props

  // Consider using a switch statement for better readability if many cases
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_FLOW_RATE) {
    return (
      <FlowRateEntry
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_TIP_POSITION) {
    return (
      <TipPositionEntry
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_MIX) {
    return (
      <Mix kind="aspirate" state={state} dispatch={dispatch} onBack={onBack} />
    )
  }
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_DELAY) {
    return (
      <Delay
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_TOUCH_TIP) {
    return (
      <TouchTip
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  if (selectedSetting === SETTING_OPTIONS.ASPIRATE_AIR_GAP) {
    return (
      <AirGap
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  return null
}
