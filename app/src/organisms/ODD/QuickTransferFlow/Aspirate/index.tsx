import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'

import { ResetAdvancedSettingsModal } from '../QuickTransferAdvancedSettings/ResetAdvancedSettingsModal'
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
  isMultiTransfer: boolean
}

export function Aspirate(props: AspirateProps): JSX.Element | null {
  const { state, dispatch, isMultiTransfer } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [
    selectedSetting,
    setSelectedSetting,
  ] = useState<AspirateSettingOption | null>(null)
  const [
    showResetAdvancedSettingsModal,
    setShowResetAdvancedSettingsModal,
  ] = useState<boolean>(false)

  const aspirateSettingsItems = useAspirateSettingsConfig({
    state,
    dispatch,
    setSelectedSetting,
    isMultiTransfer,
  })

  const handleResetSettings = (): void => {
    setShowResetAdvancedSettingsModal(true)
  }
  const handleClose = (): void => {
    setShowResetAdvancedSettingsModal(false)
  }

  return (
    <>
      {showResetAdvancedSettingsModal ? (
        <ResetAdvancedSettingsModal
          kind="aspirate"
          liquidClass={state.liquidClass}
          onClose={handleClose}
        />
      ) : null}
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
                  key={displayItem.option}
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
            isMultiTransfer={isMultiTransfer}
          />
        </Flex>
        <MediumButton
          buttonText={t('reset_settings', { transferName: 'aspirate' })}
          onClick={handleResetSettings}
        />
      </Flex>
    </>
  )
}
