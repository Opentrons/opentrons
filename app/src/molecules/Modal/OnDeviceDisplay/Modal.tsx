import * as React from 'react'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { BackgroundOverlay } from '../../BackgroundOverlay'
import { ModalHeader } from './ModalHeader'

import type { ModalHeaderBaseProps, ModalSize } from './types'

interface ModalProps {
  /** clicking anywhere outside of the modal closes it  */
  onOutsideClick: React.MouseEventHandler
  children: React.ReactNode
  /** for small, medium, or large modal sizes, medium by default */
  modalSize?: ModalSize
  /** see ModalHeader component for more details */
  header?: ModalHeaderBaseProps
  isError?: boolean
}
export function Modal(props: ModalProps): JSX.Element {
  const {
    modalSize = 'medium',
    onOutsideClick,
    children,
    header,
    isError,
  } = props

  let modalWidth: string = '45.625rem'
  switch (modalSize) {
    case 'small': {
      modalWidth = '32.375rem'
      break
    }
    case 'large': {
      modalWidth = '60rem'
      break
    }
  }
  return (
    <BackgroundOverlay
      onClick={e => {
        e.stopPropagation()
        onOutsideClick(e)
      }}
      justifyContent={JUSTIFY_CENTER}
    >
      <Flex
        backgroundColor={isError ? COLORS.red_two : COLORS.white}
        border={`0.375rem solid ${isError ? COLORS.red_two : COLORS.white}`}
        width={modalWidth}
        height="max-content"
        maxHeight="32.5rem"
        borderRadius={BORDERS.size_three}
        boxShadow={BORDERS.shadowSmall}
        margin={SPACING.spacing6}
        flexDirection={DIRECTION_COLUMN}
        aria-label={`modal_${modalSize}`}
        onClick={e => {
          e.stopPropagation()
        }}
      >
        {header != null ? (
          <ModalHeader
            title={header.title}
            iconName={header.iconName}
            iconColor={header.iconColor}
            hasExitIcon={header.hasExitIcon}
            onClick={onOutsideClick}
            isError={isError}
          />
        ) : null}
        <Flex
          backgroundColor={COLORS.white}
          paddingX={SPACING.spacing6}
          paddingBottom={SPACING.spacing6}
          paddingTop={header != null ? '0rem' : SPACING.spacing6}
        >
          {children}
        </Flex>
      </Flex>
    </BackgroundOverlay>
  )
}
