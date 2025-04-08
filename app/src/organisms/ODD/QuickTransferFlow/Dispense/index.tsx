import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'
import { ANALYTICS_QUICK_TRANSFER_ADVANCED_SETTINGS_TAB } from '/app/redux/analytics'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { DispenseSettingDetail } from './DispenseSettingDetail'
import { DispenseSettingItem } from './DispenseSettingItem'
import { useDispenseSettingsConfig } from './hooks/useDispenseSettingsConfig'

import type { Dispatch } from 'react'
import type {
  DispenseSettingOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

const PADDING_TOP_FOR_NAV = '12rem'

interface DispenseProps {
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
}

export function Dispense(props: DispenseProps): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [
    selectedSetting,
    setSelectedSetting,
  ] = useState<DispenseSettingOption | null>(null)
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const dispenseSettingsItems = useDispenseSettingsConfig({
    state,
    setSelectedSetting,
  })

  useEffect(() => {
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_ADVANCED_SETTINGS_TAB,
      properties: {},
    })
  }, [])

  return (
    <Flex
      gridGap={SPACING.spacing40}
      flexDirection={DIRECTION_COLUMN}
      paddingTop={PADDING_TOP_FOR_NAV}
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {selectedSetting == null
          ? dispenseSettingsItems.map(displayItem => (
              <DispenseSettingItem
                key={displayItem.value}
                displayItem={displayItem}
              />
            ))
          : null}
        <DispenseSettingDetail
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
        buttonText={t('reset_settings', { transferName: 'dispense' })}
        onClick={() => {
          console.log('reset dispense settings')
        }}
      />
    </Flex>
  )
}
