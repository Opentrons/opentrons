import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { ANALYTICS_QUICK_TRANSFER_ADVANCED_SETTINGS_TAB } from '/app/redux/analytics'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { MediumButton } from '/app/atoms/buttons'
import { AspirateSettingsList } from './AspirateSettingsList'
import { AspirateSettingDetail } from './AspirateSettingDetail'
import { useAspirateSettingsConfig } from './hooks/useAspirateSettingsConfig'

import type { Dispatch } from 'react'
import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

const PADDING_TOP_FOR_NAV = '12rem'

export const SETTING_OPTIONS = {
  ASPIRATE_FLOW_RATE: 'aspirate_flow_rate',
  ASPIRATE_TIP_POSITION: 'aspirate_tip_position',
  ASPIRATE_SUBMERGE: 'aspirate_submerge',
  PRE_WET_TIP: 'pre_wet_tip',
  ASPIRATE_MIX: 'aspirate_mix',
  ASPIRATE_DELAY: 'aspirate_delay',
  ASPIRATE_RETRACT: 'aspirate_retract',
  ASPIRATE_TOUCH_TIP: 'aspirate_touch_tip',
  ASPIRATE_AIR_GAP: 'aspirate_air_gap',
} as const

export type SettingOption = typeof SETTING_OPTIONS[keyof typeof SETTING_OPTIONS]

interface AspirateProps {
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
}

export function Aspirate(props: AspirateProps): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedSetting, setSelectedSetting] = useState<SettingOption | null>(
    null
  )
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()

  useEffect(() => {
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_ADVANCED_SETTINGS_TAB,
      properties: {},
    })
  }, [])

  const aspirateSettingsItems = useAspirateSettingsConfig({
    state,
    dispatch,
    setSelectedSetting,
  })

  return (
    <Flex
      gap={SPACING.spacing40}
      flexDirection={DIRECTION_COLUMN}
      paddingTop={PADDING_TOP_FOR_NAV}
    >
      <Flex gap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {selectedSetting == null ? (
          <AspirateSettingsList items={aspirateSettingsItems} />
        ) : null}
        <AspirateSettingDetail
          selectedSetting={selectedSetting}
          state={state}
          dispatch={dispatch}
          onBack={() => {
            setSelectedSetting(null)
          }}
        />
      </Flex>

      {/* ToDo add reset button for aspirate settings */}
      <MediumButton
        buttonText={t('reset_settings', { transferName: 'aspirate' })}
        onClick={() => {
          console.log('reset aspirate settings')
        }}
      />
    </Flex>
  )
}
