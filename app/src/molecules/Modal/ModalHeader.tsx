import * as React from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import type { ModalHeaderBaseProps } from '../Modal/types'

export function ModalHeader(props: ModalHeaderBaseProps): JSX.Element {
  const { title, hasExitIcon, iconName, iconColor, onClick } = props
  return (
    <Flex
      backgroundColor={COLORS.white}
      color={COLORS.black}
      height="6.25rem"
      width="100%"
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={`${BORDERS.borderRadiusSize3} ${BORDERS.borderRadiusSize3} 0px 0px`}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        {iconName != null && iconColor != null ? (
          <Icon
            aria-label={`icon_${iconName}`}
            name={iconName}
            color={iconColor}
            size="2rem"
            alignSelf={ALIGN_CENTER}
            marginRight={SPACING.spacing16}
          />
        ) : null}
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightBold}
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
        >
          {title}
        </StyledText>
      </Flex>
      {hasExitIcon && onClick != null ? (
        <Flex
          onClick={onClick}
          aria-label="closeIcon"
          alignItems={ALIGN_CENTER}
        >
          <Icon size="3.5rem" name="ot-close" />
        </Flex>
      ) : null}
    </Flex>
  )
}
