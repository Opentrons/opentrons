import * as React from 'react'
import { BaseModalProps, SPACING, COLORS, Box } from '@opentrons/components'
import { ModalHeader } from './ModalHeader'
import { ModalShell } from './ModalShell'

import type { IconProps } from '@opentrons/components'

type ModalType = 'info' | 'warning' | 'error'
export * from './ModalShell'
export * from './ModalHeader'

export interface ModalProps extends BaseModalProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  closeOnOutsideClick?: boolean
  title?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  icon?: IconProps
}

export const Modal = (props: ModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    closeOnOutsideClick,
    title,
    children,
    maxHeight,
  } = props

  const modalHeader = (
    <ModalHeader
      onClose={onClose}
      title={title}
      icon={
        ['error', 'warning'].includes(type)
          ? {
              name: 'ot-alert',
              color: type === 'error' ? COLORS.error : COLORS.warning,
              size: SPACING.spacingM,
              marginRight: SPACING.spacing3,
            }
          : undefined
      }
    />
  )

  return (
    <ModalShell
      width="31.25rem"
      header={modalHeader}
      onOutsideClick={closeOnOutsideClick ? onClose : undefined}
      // center within viewport aside from nav
      marginLeft="7.125rem"
      {...props}
    >
      <Box
        paddingTop={SPACING.spacing4}
        paddingBottom={SPACING.spacing5}
        paddingX={SPACING.spacing5}
        maxHeight={maxHeight}
      >
        {children}
      </Box>
    </ModalShell>
  )
}
