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

type SettingOption = typeof SETTING_OPTIONS[keyof typeof SETTING_OPTIONS]

interface CommonSettingProps {
  kind: 'aspirate'
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  onBack: () => void
}

const SettingComponentMap: Partial<
  Record<SettingOption, React.ComponentType<CommonSettingProps>>
> = {
  [SETTING_OPTIONS.ASPIRATE_FLOW_RATE]: FlowRateEntry,
  [SETTING_OPTIONS.ASPIRATE_TIP_POSITION]: TipPositionEntry,
  [SETTING_OPTIONS.ASPIRATE_MIX]: Mix,
  [SETTING_OPTIONS.ASPIRATE_DELAY]: Delay,
  [SETTING_OPTIONS.ASPIRATE_TOUCH_TIP]: TouchTip,
  [SETTING_OPTIONS.ASPIRATE_AIR_GAP]: AirGap,
  // ToDo(kk:04/03/2025) add pre-wet tip
  // [SETTING_OPTIONS.PRE_WET_TIP]: PreWetTip,
}
interface AspirateSettingDetailProps extends Omit<CommonSettingProps, 'kind'> {
  selectedSetting: SettingOption | null
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
