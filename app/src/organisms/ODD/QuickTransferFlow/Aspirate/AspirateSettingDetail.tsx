import { ASPIRATE_SETTING_OPTIONS as SETTING_OPTIONS } from '../constants'
import { AirGap } from '../QuickTransferAdvancedSettings/AirGap'
import { Delay } from '../QuickTransferAdvancedSettings/Delay'
import { FlowRateEntry } from '../QuickTransferAdvancedSettings/FlowRate'
import { Mix } from '../QuickTransferAdvancedSettings/Mix'
import { PreWetTip } from '../QuickTransferAdvancedSettings/PreWetTip'
import { Retract } from '../QuickTransferAdvancedSettings/Retract'
import { Submerge } from '../QuickTransferAdvancedSettings/Submerge'
import { TipPositionEntry } from '../QuickTransferAdvancedSettings/TipPosition'
import { TouchTip } from '../QuickTransferAdvancedSettings/TouchTip'

import type { ComponentType, Dispatch } from 'react'
import type {
  AspirateSettingOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface CommonSettingProps {
  kind: 'aspirate'
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  onBack: () => void
}

const SettingComponentMap: Partial<
  Record<AspirateSettingOption, ComponentType<CommonSettingProps>>
> = {
  [SETTING_OPTIONS.ASPIRATE_FLOW_RATE]: FlowRateEntry,
  [SETTING_OPTIONS.ASPIRATE_TIP_POSITION]: TipPositionEntry,
  [SETTING_OPTIONS.ASPIRATE_MIX]: Mix,
  [SETTING_OPTIONS.ASPIRATE_DELAY]: Delay,
  [SETTING_OPTIONS.ASPIRATE_TOUCH_TIP]: TouchTip,
  [SETTING_OPTIONS.ASPIRATE_AIR_GAP]: AirGap,
  [SETTING_OPTIONS.ASPIRATE_SUBMERGE]: Submerge,
  [SETTING_OPTIONS.ASPIRATE_RETRACT]: Retract,
  [SETTING_OPTIONS.PRE_WET_TIP]: PreWetTip,
}
interface AspirateSettingDetailProps extends Omit<CommonSettingProps, 'kind'> {
  selectedSetting: AspirateSettingOption | null
}

export function AspirateSettingDetail({
  selectedSetting,
  state,
  dispatch,
  onBack,
}: AspirateSettingDetailProps): JSX.Element | null {
  if (selectedSetting === null || !(selectedSetting in SettingComponentMap)) {
    return null
  }
  const SelectedComponent = SettingComponentMap[selectedSetting]
  if (SelectedComponent !== undefined) {
    return (
      <SelectedComponent
        kind="aspirate"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  return null
}
