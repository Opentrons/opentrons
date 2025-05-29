import { DISPENSE_SETTING_OPTIONS as SETTING_OPTIONS } from '../constants'
import { AirGap } from '../QuickTransferAdvancedSettings/AirGap'
import { BlowOut } from '../QuickTransferAdvancedSettings/BlowOut'
import { Delay } from '../QuickTransferAdvancedSettings/Delay'
import { FlowRateEntry } from '../QuickTransferAdvancedSettings/FlowRate'
import { Mix } from '../QuickTransferAdvancedSettings/Mix'
import { PushOut } from '../QuickTransferAdvancedSettings/PushOut'
import { Retract } from '../QuickTransferAdvancedSettings/Retract'
import { Submerge } from '../QuickTransferAdvancedSettings/Submerge'
import { TipPositionEntry } from '../QuickTransferAdvancedSettings/TipPosition'
import { TouchTip } from '../QuickTransferAdvancedSettings/TouchTip'

import type { ComponentType, Dispatch } from 'react'
import type {
  DispenseSettingOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface CommonSettingProps {
  kind: 'dispense'
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  onBack: () => void
}

const SettingComponentMap: Partial<
  Record<DispenseSettingOption, ComponentType<CommonSettingProps>>
> = {
  [SETTING_OPTIONS.DISPENSE_FLOW_RATE]: FlowRateEntry,
  [SETTING_OPTIONS.DISPENSE_TIP_POSITION]: TipPositionEntry,
  [SETTING_OPTIONS.DISPENSE_MIX]: Mix,
  [SETTING_OPTIONS.DISPENSE_DELAY]: Delay,
  [SETTING_OPTIONS.DISPENSE_TOUCH_TIP]: TouchTip,
  [SETTING_OPTIONS.DISPENSE_AIR_GAP]: AirGap,
  [SETTING_OPTIONS.DISPENSE_BLOW_OUT]: BlowOut,
  [SETTING_OPTIONS.DISPENSE_SUBMERGE]: Submerge,
  [SETTING_OPTIONS.DISPENSE_RETRACT]: Retract,
  [SETTING_OPTIONS.DISPENSE_PUSH_OUT]: PushOut,
}

interface DispenseSettingDetailProps extends Omit<CommonSettingProps, 'kind'> {
  selectedSetting: DispenseSettingOption | null
}

export function DispenseSettingDetail({
  selectedSetting,
  state,
  dispatch,
  onBack,
}: DispenseSettingDetailProps): JSX.Element | null {
  if (selectedSetting === null || !(selectedSetting in SettingComponentMap)) {
    return null
  }
  const SelectedComponent = SettingComponentMap[selectedSetting]
  if (SelectedComponent !== undefined) {
    return (
      <SelectedComponent
        kind="dispense"
        state={state}
        dispatch={dispatch}
        onBack={onBack}
      />
    )
  }
  return null
}
