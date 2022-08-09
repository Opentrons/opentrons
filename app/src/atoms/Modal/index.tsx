import * as React from 'react'
import { css } from 'styled-components'
import {
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
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../text'
import { Divider } from '../structure'
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

const closeIconStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
  width: ${SPACING.spacingL};
  height: ${SPACING.spacingL};
  &:hover {
    background-color: ${COLORS.lightGreyEnabled};
  }

  &:active {
    background-color: ${COLORS.lightGreyHover};
  }
`

export const Modal = (props: ModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    closeOnOutsideClick,
    title,
    children,
    maxHeight,
  } = props
  const defaultHeader =
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
                name="ot-alert"
                color={
                  type === 'error' ? COLORS.errorEnabled : COLORS.warningEnabled
                }
                size={SPACING.spacingM}
                marginRight={SPACING.spacing3}
              />
            ) : null}
            <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {title}
            </StyledText>
          </Flex>
          {onClose != null && (
            <Btn
              onClick={onClose}
              css={closeIconStyles}
              data-testid={`Modal_icon_close_${
                typeof title === 'string' ? title : ''
              }`}
            >
              <Icon
                name="close"
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
    <BaseModal
      width={props.width ? props.width : '31.25rem'}
      noHeaderStyles
      header={defaultHeader}
      css={css`
        border-radius: ${BORDERS.radiusSoftCorners};
        box-shadow: ${BORDERS.smallDropShadow};
        max-height: ${maxHeight};
      `}
      onOutsideClick={closeOnOutsideClick ? onClose : undefined}
    >
      {children}
    </BaseModal>
  )
}
