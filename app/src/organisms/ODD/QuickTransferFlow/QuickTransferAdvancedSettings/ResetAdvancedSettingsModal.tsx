import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getAllLiquidClassDefs } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import { ACTIONS } from '../constants'
import { retrieveLiquidClassValues } from '../utils'

import type { Dispatch, ReactNode } from 'react'
import type { IconName } from '@opentrons/components'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface ResetAdvancedSettingsModalProps {
  state: QuickTransferSummaryState
  kind: Omit<FlowRateKind, 'blowout'>
  dispatch: Dispatch<QuickTransferSummaryAction>
  onClose: () => void
}

export function ResetAdvancedSettingsModal({
  state,
  kind,
  dispatch,
  onClose,
}: ResetAdvancedSettingsModalProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { liquidClassName: stateLiquidClassName } = state
  const liquidClass =
    stateLiquidClassName != null && stateLiquidClassName !== 'none'
      ? getAllLiquidClassDefs()[stateLiquidClassName]
      : { displayName: 'none', liquidClassName: 'none' }
  const { displayName, liquidClassName } = liquidClass
  const modalHeader = {
    title: t('reset_kind_settings', { transferName: kind }),
    iconName: 'ot-alert' as IconName,
    iconColor: COLORS.yellow50,
  }
  const modalProps = {
    header: { ...modalHeader },
  }

  const handleClickContinue = (): void => {
    const liquidHandlingAction = kind as 'aspirate' | 'dispense'
    const liquidClassValues = retrieveLiquidClassValues(
      state,
      liquidHandlingAction
    )
    dispatch({
      type: ACTIONS.SET_LIQUID_CLASS_VALUES,
      liquidClassValues: {
        ...liquidClassValues,
      },
    })
    onClose()
  }

  return createPortal(
    <OddModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing32}>
        <StyledText oddStyle="bodyTextRegular">
          {liquidClassName !== 'none'
            ? t('reset_settings_with_liquid_class_description', {
                transferName: kind,
                liquidClassName: displayName,
              })
            : t('reset_settings_description', {
                transferName: kind,
              })}
        </StyledText>
        <Flex gap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonType="secondary"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={onClose}
          />
          <SmallButton
            flex="1"
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
            onClick={handleClickContinue}
          />
        </Flex>
      </Flex>
    </OddModal>,
    getTopPortalEl()
  )
}
