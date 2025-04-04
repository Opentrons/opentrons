import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  Icon,
} from '@opentrons/components'

import { getMainPagePortalEl } from './Portal'

interface ResetSettingsModalProps {
  tab: 'aspirate' | 'dispense'
  onClose: () => void
  onScroll: () => void
  liquidClass?: string | null
}
export function ResetSettingsModal(
  props: ResetSettingsModalProps
): JSX.Element {
  const { tab, liquidClass, onClose, onScroll } = props
  const { t, i18n } = useTranslation('protocol_steps')

  const handleContinue = (): void => {
    console.log('TODO: Wire up reset settings modal.')
    onClose()
    onScroll()
  }

  return createPortal(
    <Modal
      marginLeft="0"
      title={t(`protocol_steps:reset_settings`, { tab })}
      titleElement1={
        <Icon name="alert-circle" color={COLORS.yellow50} size="1.25rem" />
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
            data-testid="ResetSettingsModal_continueButton"
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
            {liquidClass !== null && liquidClass !== ''
              ? t(
                  'protocol_steps:comfirm_reset_settings.liquid_class_selected',
                  {
                    liquidClass,
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
