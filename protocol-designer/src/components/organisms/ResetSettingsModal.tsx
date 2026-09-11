import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getLiquidClassDisplayName } from '/protocol-designer/liquid-defs/utils'

import { getMainPagePortalEl } from './Portal'

interface ResetSettingsModalProps {
  tab: 'aspirate' | 'dispense'
  onContinue: () => void
  onClose: () => void
  onScroll: () => void
  liquidClass?: string | null
}
export function ResetSettingsModal(
  props: ResetSettingsModalProps
): JSX.Element {
  const { tab, liquidClass, onContinue, onClose, onScroll } = props
  const { t, i18n } = useTranslation('protocol_steps')

  const isLiquidClassSelected = liquidClass !== null && liquidClass !== ''
  const liquidClassName = getLiquidClassDisplayName(String(liquidClass))

  const handleContinue = (): void => {
    onContinue()
    onClose()
    onScroll()
  }

  return createPortal(
    <Modal
      title={t(`protocol_steps:reset_settings`, { tab })}
      titleElement1={
        <Icon name="ot-alert" color={COLORS.yellow50} size="1.25rem" />
      }
      type="info"
      closeOnOutsideClick
      onClose={onClose}
      childrenPadding={SPACING.spacing24}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
        >
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              handleContinue()
            }}
          >
            {i18n.format(t('shared:continue'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
            {isLiquidClassSelected
              ? t(
                  'protocol_steps:comfirm_reset_settings.liquid_class_selected',
                  {
                    liquidClassName,
                  }
                )
              : t('protocol_steps:comfirm_reset_settings.no_liquid_class')}
          </StyledText>
        </Flex>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}
