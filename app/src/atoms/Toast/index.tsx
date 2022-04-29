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
  ALIGN_CENTER,
} from '@opentrons/components'
import type { IconProps } from '@opentrons/components'
import { StyledText } from '../text'

export interface ToastProps {
  message: string | JSX.Element
  type?: 'success' | 'warning' | 'error' | 'info'
  icon?: IconProps
  closeButton?: boolean
  onClose: () => void
  requiredTimeout?: boolean
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
  const { message, type, icon, closeButton, onClose, requiredTimeout } = props
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
  } else {
    iconName = icon?.name != null ? icon.name : 'information'
    color = COLORS.darkBlack
    backgroundColor = COLORS.greyDisabled
  }

  if (!(requiredTimeout ?? false)) {
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  return (
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.radiusSoftCorners}
      borderColor={color}
      borderWidth={SPACING.spacingXXS}
      border={BORDER_STYLE_SOLID}
      backgroundColor={backgroundColor}
      paddingX={SPACING.spacing3}
      paddingY={SPACING.spacing2}
      right={SPACING.spacing4}
      bottom={SPACING.spacing4}
      position="fixed"
      data-testid={`Toast_${type as string}`}
    >
      <Flex flexDirection="row">
        <Icon
          name={iconName}
          color={color}
          width={SPACING.spacing4}
          marginRight={SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
          aria-label={`icon_${type as string}`}
        />
        <StyledText as="p">{message}</StyledText>
      </Flex>
      {closeButton === true && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <Icon
            name="close"
            width={SPACING.spacing5}
            marginLeft={SPACING.spacing3}
          />
        </Link>
      )}
    </Flex>
  )
}
