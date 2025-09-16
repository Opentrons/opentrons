import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Check,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'

export * from './useOverlayModal'
export interface OverlayModalProps {
  header: string
  subText?: string
  children: ReactNode
  handleCancel: () => void
  handleContinue: () => void
}

export function OverlayModal(props: OverlayModalProps): JSX.Element {
  const { header, subText, children, handleCancel, handleContinue } = props
  const { t, i18n } = useTranslation(['alert', 'shared'])

  const onCancelClick = (): void => {
    handleCancel()
  }

  const onContinueClick = (): void => {
    // dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleContinue()
  }

  return createPortal(
    <Modal
      marginLeft="0"
      zIndexOverlay={15}
      width="100%"
      height="100%"
      hasHeader={false}
      backgroundColor={COLORS.transparentBlack90}
      showOverlay={true}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing16}
      >
        <StyledText desktopStyle="headingLargeBold" oddStyle="level4HeaderBold">
          {header}
        </StyledText>
        {subText != null ? (
          <StyledText
            desktopStyle="bodyLargeRegular"
            oddStyle="bodyTextRegular"
            color={COLORS.grey60}
          >
            {subText}
          </StyledText>
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {children}
        </Flex>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}
