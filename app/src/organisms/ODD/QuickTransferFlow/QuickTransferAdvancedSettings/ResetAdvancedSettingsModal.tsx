import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { LiquidClass } from '@opentrons/shared-data'
import type { FlowRateKind } from '../types'

interface ResetAdvancedSettingsModalProps {
  kind: Omit<FlowRateKind, 'blowout'>
  liquidClass: LiquidClass
  onClose: () => void
}

export function ResetAdvancedSettingsModal({
  kind,
  liquidClass,
  onClose,
}: ResetAdvancedSettingsModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { displayName, liquidClassName } = liquidClass
  const modalHeader = {
    title: t('reset_kind_settings', { transferName: kind }),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  const modalProps = {
    header: { ...modalHeader },
  }

  const handleClickContinue = (): void => {
    console.log('todo add hooks to reset settings for', kind)
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
