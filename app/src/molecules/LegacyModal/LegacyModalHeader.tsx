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
  JUSTIFY_CENTER,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import type { IconProps } from '@opentrons/components'

export interface LegacyModalHeaderProps {
  onClose?: React.MouseEventHandler
  title: React.ReactNode
  backgroundColor?: string
  color?: string
  icon?: IconProps
  closeButton?: JSX.Element
}

const closeIconStyles = css`
  display: flex;
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  border-radius: 0.875rem;
  width: 1.625rem;
  height: 1.625rem;
  &:hover {
    background-color: ${COLORS.lightGreyHover};
  }

  &:active {
    background-color: ${COLORS.lightGreyPressed};
  }
`

export const LegacyModalHeader = (
  props: LegacyModalHeaderProps
): JSX.Element => {
  const { icon, onClose, title, backgroundColor, color, closeButton } = props
  return (
    <>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        paddingX={SPACING.spacing24}
        paddingY={SPACING.spacing16}
        backgroundColor={backgroundColor}
        data-testid="Modal_header"
      >
        <Flex>
          {icon != null && <Icon {...icon} data-testid="Modal_header_icon" />}
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={color}
          >
            {title}
          </StyledText>
        </Flex>
        {closeButton != null
          ? { closeButton }
          : onClose != null && (
              <Btn
                onClick={onClose}
                css={closeIconStyles}
                data-testid={`ModalHeader_icon_close${
                  typeof title === 'string' ? `_${title}` : ''
                }`}
              >
                <Icon
                  name="close"
                  width={SPACING.spacing24}
                  height={SPACING.spacing24}
                  color={color}
                />
              </Btn>
            )}
      </Flex>
      <Divider width="100%" marginY="0" />
    </>
  )
}
