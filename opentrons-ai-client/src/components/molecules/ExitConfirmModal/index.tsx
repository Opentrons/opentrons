import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { displayExitConfirmModalAtom } from '/ai-client/resources/atoms'

export function ExitConfirmModal(): JSX.Element {
  const [displayExitConfirmModalState, setDisplayExitConfirmModalState] =
    useAtom(displayExitConfirmModalAtom)
  const navigate = useNavigate()
  const { t } = useTranslation('protocol_generator')

  if (!displayExitConfirmModalState) {
    return <></>
  }

  function handleContinueClick(): void {
    setDisplayExitConfirmModalState(false)
  }

  function handleExitClick(): void {
    setDisplayExitConfirmModalState(false)
    navigate('/')
  }

  return (
    <Modal type="info" title={t('exit_confirmation_title')}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          paddingTop={`${SPACING.spacing8}`}
          paddingBottom={`${SPACING.spacing24}`}
        >
          {t('exit_confirmation_body')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} gap={SPACING.spacing8}>
          <SecondaryButton onClick={handleContinueClick}>
            {t('exit_confirmation_cancel')}
          </SecondaryButton>
          <PrimaryButton variant="warning" onClick={handleExitClick}>
            {t('exit_confirmation_exit')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
