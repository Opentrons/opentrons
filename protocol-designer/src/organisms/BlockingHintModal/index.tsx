import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  ALIGN_CENTER,
  COLORS,
  Check,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { actions } from '../../tutorial'
import { getMainPagePortalEl } from '../../components/portals/MainPageModalPortal'
import type { ReactNode } from 'react'
import type { HintKey } from '../../tutorial'

export interface HintProps {
  hintKey: HintKey
  handleCancel: () => void
  handleContinue: () => void
  content: ReactNode
}

export function BlockingHintModal(props: HintProps): JSX.Element {
  const { content, hintKey, handleCancel, handleContinue } = props
  const { t, i18n } = useTranslation(['alert', 'shared'])
  const dispatch = useDispatch()

  const [rememberDismissal, setRememberDismissal] = useState<boolean>(false)

  const toggleRememberDismissal = useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])

  const onCancelClick = (): void => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleCancel()
  }

  const onContinueClick = (): void => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleContinue()
  }

  return createPortal(
    <Modal
      type="warning"
      title={t(`hint.${hintKey}.title`)}
      onClose={onCancelClick}
      footer={
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing24}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            onClick={toggleRememberDismissal}
            gridGap={SPACING.spacing8}
          >
            <Check isChecked={rememberDismissal} color={COLORS.blue50} />
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('hint.dont_show_again')}
            </StyledText>
          </Flex>
          <Flex alingItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
            <SecondaryButton onClick={onCancelClick}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={onContinueClick}>
              {i18n.format(t('shared:continue'), 'capitalize')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      {content}
    </Modal>,
    getMainPagePortalEl()
  )
}
