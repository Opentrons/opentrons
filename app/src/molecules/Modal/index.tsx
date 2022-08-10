import * as React from 'react'
import { StyleProps, SPACING, COLORS, Box } from '@opentrons/components'
import { ModalHeader } from './ModalHeader'
import { ModalShell } from './ModalShell'

type ModalType = 'info' | 'warning' | 'error'
export * from './ModalShell'
export * from './ModalHeader'

export interface ModalProps extends StyleProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  closeOnOutsideClick?: boolean
  title?: React.ReactNode
  footer?: React.ReactNode
  childrenPadding?: string | number
  children?: React.ReactNode
}

export const Modal = (props: ModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    closeOnOutsideClick,
    title,
    childrenPadding = `${SPACING.spacing4} ${SPACING.spacing5} ${SPACING.spacing5}`,
    children,
  } = props

  const modalHeader = (
    <ModalHeader
      onClose={onClose}
      title={title}
      icon={
        ['error', 'warning'].includes(type)
          ? {
              name: 'ot-alert',
              color:
                type === 'error' ? COLORS.errorEnabled : COLORS.warningEnabled,
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
      <Box padding={childrenPadding}>{children}</Box>
    </ModalShell>
  )
}
