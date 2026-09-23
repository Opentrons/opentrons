import { useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { HandleEnter } from '/protocol-designer/components/atoms'

import type { Dispatch, SetStateAction } from 'react'

interface IncompatibleTipsProps {
  onClose: () => void
  setAllowAllTipracks: Dispatch<SetStateAction<boolean>>
}
export function IncompatibleTipsModal(
  props: IncompatibleTipsProps
): JSX.Element {
  const { onClose, setAllowAllTipracks } = props
  const { t } = useTranslation(['onboarding', 'shared'])

  const handleShowAllTips = (): void => {
    onClose()
    setAllowAllTipracks(true)
  }

  return (
    <HandleEnter onEnter={handleShowAllTips}>
      <Modal
        title={t('incompatible_tips')}
        type="warning"
        closeOnOutsideClick
        onClose={onClose}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={SPACING.spacing24}
          >
            <SecondaryButton onClick={handleShowAllTips}>
              {t('show_tips')}
            </SecondaryButton>
            <PrimaryButton onClick={onClose}>
              {t('shared:cancel')}
            </PrimaryButton>
          </Flex>
        }
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('incompatible_tip_body')}
        </StyledText>
      </Modal>
    </HandleEnter>
  )
}
