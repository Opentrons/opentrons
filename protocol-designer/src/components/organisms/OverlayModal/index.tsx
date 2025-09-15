import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Check,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { actions } from '/protocol-designer/tutorial'

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
  const dispatch = useDispatch()

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
      type="warning"
      zIndexOverlay={15}
      title={header}
      onClose={onCancelClick}
      footer={
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
        </Flex>
      }
    >
      {children}
    </Modal>,
    getMainPagePortalEl()
  )
}
