import * as React from 'react'
import { SPACING, COLORS, Box } from '@opentrons/components'
import { LegacyModalHeader } from './LegacyModalHeader'
import { LegacyModalShell } from './LegacyModalShell'
import type { StyleProps } from '@opentrons/components'

type ModalType = 'info' | 'warning' | 'error'
export * from './LegacyModalShell'
export * from './LegacyModalHeader'

export interface LegacyModalProps extends StyleProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  closeOnOutsideClick?: boolean
  title?: React.ReactNode
  fullPage?: boolean
  childrenPadding?: string | number
  children?: React.ReactNode
}

export const LegacyModal = (props: LegacyModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    closeOnOutsideClick,
    title,
    childrenPadding = `${SPACING.spacing16} ${SPACING.spacing24} ${SPACING.spacing24}`,
    children,
    ...styleProps
  } = props

  const modalHeader = (
    <LegacyModalHeader
      onClose={onClose}
      title={title}
      icon={
        ['error', 'warning'].includes(type)
          ? {
              name: 'ot-alert',
              color:
                type === 'error' ? COLORS.errorEnabled : COLORS.warningEnabled,
              size: SPACING.spacing20,
              marginRight: SPACING.spacing8,
            }
          : undefined
      }
    />
  )

  return (
    <LegacyModalShell
      width={styleProps.width ?? '31.25rem'}
      header={modalHeader}
      onOutsideClick={closeOnOutsideClick ?? false ? onClose : undefined}
      // center within viewport aside from nav
      marginLeft="7.125rem"
      {...props}
    >
      <Box padding={childrenPadding}>{children}</Box>
    </LegacyModalShell>
  )
}
