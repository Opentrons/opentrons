import * as React from 'react'

import {
  Text,
  Btn,
  Icon,
  BaseModal,
  BaseModalProps,
  TYPOGRAPHY,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { Divider } from '../structure'

type ModalType = 'info' | 'warning' | 'error'
interface ModalProps extends BaseModalProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  title?: React.ReactNode
  children?: React.ReactNode
}

export const Modal = (props: ModalProps): JSX.Element => {
  const { type = 'info', onClose, title, children } = props
  const header =
    title != null ? (
      <>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          paddingX={SPACING.spacing5}
          paddingY={SPACING.spacing4}
        >
          <Flex>
            {['error', 'warning'].includes(type) ? (
              <Icon
                name="alert-circle"
                color={type === 'error' ? COLORS.error : COLORS.warning}
                size="1.25rem"
                marginRight={SPACING.spacing3}
              />
            ) : null}
            <Text css={TYPOGRAPHY.h3SemiBold}>{title}</Text>
          </Flex>
          {onClose != null && (
            <Btn onClick={onClose}>
              <Icon
                name={'close'}
                width={SPACING.spacing5}
                height={SPACING.spacing5}
              />
            </Btn>
          )}
        </Flex>
        <Divider width="100%" marginY="0" />
      </>
    ) : null

  return (
    <BaseModal width={'31.25rem'} noHeaderStyles header={header}>
      {children}
    </BaseModal>
  )
}
