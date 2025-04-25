import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'

import { AspirateSettingDetail } from './AspirateSettingDetail'
import { AspirateSettingItem } from './AspirateSettingItem'
import { useAspirateSettingsConfig } from './hooks/useAspirateSettingsConfig'

import type { Dispatch } from 'react'
import type {
  AspirateSettingOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

const PADDING_TOP_FOR_NAV = '12rem'
interface AspirateProps {
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
}

export function Aspirate(props: AspirateProps): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [
    selectedSetting,
    setSelectedSetting,
  ] = useState<AspirateSettingOption | null>(null)

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
          <Flex gap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            {aspirateSettingsItems.map(displayItem => (
              <AspirateSettingItem
                key={displayItem.value}
                displayItem={displayItem}
              />
            ))}
          </Flex>
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
