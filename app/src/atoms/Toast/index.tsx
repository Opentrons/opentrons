import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  Link,
  Icon,
  BORDERS,
  COLORS,
  SPACING,
  IconName,
  JUSTIFY_SPACE_BETWEEN,
  BORDER_STYLE_SOLID,
} from '@opentrons/components'
import { StyledText } from '../text'

export interface ToastProps {
  message: string | JSX.Element
  type: 'success' | 'warning' | 'error'
  closeButton?: boolean
  onClose: () => void
}

const EXPANDED_STYLE = css`
  animation-duration: 300ms;
  animation-name: slidein;
  overflow: hidden;

  @keyframes slidein {
    from {
      bottom: 0;
    }
    to {
      bottom: ${SPACING.spacing4};
    }
  }
`
export function Toast(props: ToastProps): JSX.Element {
  const { message, type, closeButton, onClose } = props
  let iconName: IconName = 'alert-circle'
  let color = COLORS.error
  let backgroundColor = COLORS.errorBg

  if (type === 'warning') {
    color = COLORS.warning
    backgroundColor = COLORS.warningBg
  } else if (type === 'success') {
    iconName = 'check-circle'
    color = COLORS.success
    backgroundColor = COLORS.successBg
  }

  setTimeout(() => {
    onClose()
  }, 3000)

  return (
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      borderRadius={BORDERS.radiusSoftCorners}
      borderColor={color}
      borderWidth={SPACING.spacingXXS}
      border={BORDER_STYLE_SOLID}
      backgroundColor={backgroundColor}
      padding={SPACING.spacing3}
      right={SPACING.spacing4}
      bottom={SPACING.spacing4}
      position="fixed"
    >
      <Flex flexDirection="row">
        <Icon
          name={iconName}
          color={color}
          width={SPACING.spacing4}
          marginRight={SPACING.spacing3}
        />
        <StyledText as="p">{message}</StyledText>
      </Flex>
      {closeButton === true && (
        <Link onClick={() => onClose()}>
          <Icon name="close" width={SPACING.spacing4}></Icon>
        </Link>
      )}
    </Flex>
  )
}
