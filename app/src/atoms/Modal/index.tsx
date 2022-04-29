import * as React from 'react'
import { css } from 'styled-components'
import {
  Btn,
  Icon,
  TYPOGRAPHY,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
  BORDERS,
  POSITION_ABSOLUTE,
  JUSTIFY_CENTER,
  Box,
  POSITION_RELATIVE,
  OVERFLOW_AUTO,
  POSITION_STICKY,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { StyledText } from '../text'
import { Divider } from '../structure'

import type { IconProps } from '@opentrons/components'

type ModalType = 'info' | 'warning' | 'error'
export interface ModalProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  title?: React.ReactNode
  children?: React.ReactNode
  icon?: IconProps
  footer?: React.ReactNode
  backgroundColor?: string
}

const closeIconStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
  width: ${SPACING.spacingL};
  height: ${SPACING.spacingL};
  &:hover {
    background-color: #16212d26;
  }

  &:active {
    background-color: #16212d40;
  }
`

export const Modal = (props: ModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    title,
    children,
    footer,
    backgroundColor = COLORS.backgroundOverlay,
  } = props

  return (
    <Flex
      position={POSITION_ABSOLUTE}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      top={0}
      right={0}
      bottom={0}
      left={0}
      width="100%"
      height="100%"
      padding={`${SPACING.spacing4}, ${SPACING.spacing5}`}
      backgroundColor={backgroundColor}
      zIndex={10}
    >
      <Box
        backgroundColor={COLORS.white}
        position={POSITION_RELATIVE}
        overflowY={OVERFLOW_AUTO}
        maxHeight="100%"
        width={'31.25rem'}
        borderRadius={BORDERS.radiusSoftCorners}
        boxShadow={BORDERS.smallDropShadow}
      >
        {title != null ? (
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
                    name={'alert-circle'}
                    color={type === 'error' ? COLORS.error : COLORS.warning}
                    size={SPACING.spacingM}
                    marginRight={SPACING.spacing3}
                    aria-label={'alert-circle'}
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
                  aria-label={'close_icon_btn'}
                  data-testid={`Modal_icon_close_${
                    typeof title === 'string' ? title : ''
                  }`}
                >
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
        ) : null}
        <Flex
          paddingX={SPACING.spacing6}
          paddingY={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
        >
          {children}
        </Flex>
        {footer != null ? (
          <Flex
            backgroundColor={COLORS.white}
            position={POSITION_STICKY}
            padding={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            bottom={0}
          >
            {footer}
          </Flex>
        ) : null}
      </Box>
    </Flex>
  )
}
