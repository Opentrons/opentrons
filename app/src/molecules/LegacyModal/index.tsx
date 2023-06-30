import * as React from 'react'
import { SPACING, COLORS, Box } from '@opentrons/components'
import { LegacyModalHeader } from './LegacyModalHeader'
import { LegacyModalShell } from './LegacyModalShell'
import type { IconProps, StyleProps } from '@opentrons/components'

type ModalType = 'info' | 'warning' | 'error' | 'outlinedError'
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

  const iconColor = (type: ModalType): string => {
    let iconColor: string = ''
    switch (type) {
      case 'warning':
        iconColor = COLORS.warningEnabled
        break
      case 'error':
        iconColor = COLORS.errorEnabled
        break
      case 'outlinedError':
        iconColor = COLORS.white
        break
    }
    return iconColor
  }

  const modalIcon: IconProps = {
    name: 'ot-alert',
    color: iconColor(type),
    size: '1.25rem',
    marginRight: SPACING.spacing8,
  }

  const modalHeader = (
    <LegacyModalHeader
      onClose={onClose}
      title={title}
      icon={
        ['error', 'warning', 'outlinedError'].includes(type)
          ? modalIcon
          : undefined
      }
      color={type === 'outlinedError' ? COLORS.white : COLORS.darkBlackEnabled}
      backgroundColor={
        type === 'outlinedError' ? COLORS.errorEnabled : COLORS.white
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
      border={
        type === 'outlinedError'
          ? `0.375rem solid ${COLORS.errorEnabled}`
          : 'none'
      }
      {...props}
    >
      <Box padding={childrenPadding}>{children}</Box>
    </LegacyModalShell>
  )
}
