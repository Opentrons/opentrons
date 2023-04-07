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

import type { ModalHeaderProps, ModalSize } from './types'

interface ModalProps {
  /*  clicking anywhere outside of the modal closes it  */
  onOutsideClick: React.MouseEventHandler
  children: React.ReactNode
  /*  for small, medium, or large modal sizes, medium by default */
  modalSize?: ModalSize
  header?: ModalHeaderProps
}
export function Modal(props: ModalProps): JSX.Element {
  const { modalSize = 'medium', onOutsideClick, children, header } = props

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
        backgroundColor={COLORS.white}
        width={modalWidth}
        maxHeight="32.5rem"
        borderRadius={BORDERS.size_three}
        boxShadow={BORDERS.shadowSmall}
        margin={SPACING.spacing6}
        flexDirection={DIRECTION_COLUMN}
        aria-label={`modal_${modalSize}`}
      >
        {header != null ? (
          <ModalHeader
            title={header.title}
            iconName={header.iconName}
            iconColor={header.iconColor}
            hasExitIcon={header.hasExitIcon}
          />
        ) : null}
        <Flex
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
