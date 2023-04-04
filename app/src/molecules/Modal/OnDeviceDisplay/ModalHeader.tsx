import * as React from 'react'
import {
  Flex,
  TYPOGRAPHY,
  SPACING,
  DIRECTION_ROW,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import type { ModalHeaderProps } from './types'

export function ModalHeader(props: ModalHeaderProps): JSX.Element {
  const { title, hasExitIcon, iconName, iconColor, onClick } = props
  return (
    <Flex
      width="100%"
      padding={SPACING.spacing6}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        {iconName != null && iconColor != null ? (
          <Icon
            aria-label={`icon_${iconName}`}
            name={iconName}
            color={iconColor}
            size={SPACING.spacing6}
            marginRight={SPACING.spacing4}
          />
        ) : null}
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
        >
          {title}
        </StyledText>
      </Flex>
      {hasExitIcon ? (
        <Flex
          alignItems={ALIGN_CENTER}
          onClick={onClick}
          aria-label="closeIcon"
        >
          <Icon size={SPACING.spacing6} name="ot-close" />
        </Flex>
      ) : null}
    </Flex>
  )
}
