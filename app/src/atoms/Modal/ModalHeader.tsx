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

import { StyledText } from '../text'
import { Divider } from '../structure'
import type { IconProps } from '@opentrons/components'

export interface ModalHeaderProps {
  onClose?: React.MouseEventHandler
  title: React.ReactNode
  icon?: IconProps
  closeButton?: JSX.Element
}

const closeIconStyles = css`
  display: flex;
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  border-radius: 0.875rem;
  width: ${SPACING.spacingL};
  height: ${SPACING.spacingL};
  &:hover {
    background-color: ${COLORS.lightGreyEnabled};
  }

  &:active {
    background-color: ${COLORS.lightGreyHover};
  }
`

export const ModalHeader = (props: ModalHeaderProps): JSX.Element => {
  const { icon, onClose, title, closeButton } = props
  return (
    <>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        paddingX={SPACING.spacing5}
        paddingY={SPACING.spacing4}
      >
        <Flex>
          {icon != null && <Icon {...icon} />}
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
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
                  width={SPACING.spacing5}
                  height={SPACING.spacing5}
                />
              </Btn>
            )}
      </Flex>
      <Divider width="100%" marginY="0" />
    </>
  )
}
