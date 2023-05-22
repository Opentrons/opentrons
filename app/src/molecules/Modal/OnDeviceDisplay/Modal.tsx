import * as React from 'react'
import {
  ALIGN_CENTER,
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
  /** modal content */
  children: React.ReactNode
  /** for small, medium, or large modal sizes, medium by default */
  modalSize?: ModalSize
  /** see ModalHeader component for more details */
  header?: ModalHeaderBaseProps
  /** an option for adding additional styles for an error modal */
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
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Flex
        backgroundColor={isError ? COLORS.red2 : COLORS.white}
        border={`0.375rem solid ${isError ? COLORS.red2 : COLORS.white}`}
        width={modalWidth}
        height="max-content"
        maxHeight="33.5rem"
        borderRadius={BORDERS.size3}
        boxShadow={BORDERS.shadowSmall}
        margin={SPACING.spacing32}
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
          paddingX={SPACING.spacing32}
          paddingBottom={SPACING.spacing32}
          paddingTop={header != null ? '0rem' : SPACING.spacing32}
          borderRadius={
            isError ? `0px 0px ${BORDERS.size3} ${BORDERS.size3}` : 0
          }
        >
          {children}
        </Flex>
      </Flex>
    </BackgroundOverlay>
  )
}
