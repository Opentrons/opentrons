import * as React from 'react'
import {
  Flex,
  TYPOGRAPHY,
  SPACING,
  DIRECTION_ROW,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  COLORS,
  SIZE_2,
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import type { ModalHeaderBaseProps } from '../Modal/types'

interface ModalHeaderProps extends ModalHeaderBaseProps {
  isError?: boolean
}
export function ModalHeader(props: ModalHeaderProps): JSX.Element {
  const { title, hasExitIcon, iconName, iconColor, onClick, isError } = props
  return (
    <Flex
      backgroundColor={isError ? COLORS.red2 : COLORS.white}
      color={isError ? COLORS.white : COLORS.black}
      height="6.25rem"
      width="100%"
      paddingX={SPACING.spacing32}
      paddingY={isError ? SPACING.spacing24 : SPACING.spacing32}
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
            color={isError ? COLORS.white : iconColor}
            size={SIZE_2}
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
