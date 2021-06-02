import * as React from 'react'
import {
  Box,
  Flex,
  Text,
  FLEX_NONE,
  ALIGN_CENTER,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_CAPITALIZE,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

export interface TitledControlProps extends StyleProps {
  title: string
  description: React.ReactNode
  control?: React.ReactNode
  children?: React.ReactNode
}

export function TitledControl({
  title,
  description,
  control,
  children,
  ...styleProps
}: TitledControlProps): JSX.Element {
  return (
    <Box fontSize={FONT_SIZE_BODY_1} padding={SPACING_3} {...styleProps}>
      <Flex alignItems={ALIGN_CENTER}>
        <Box paddingRight={SPACING_3} marginRight={SPACING_AUTO}>
          <Text
            as="h4"
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_2}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {title}
          </Text>
          {description}
        </Box>
        {Boolean(control) && (
          <Box paddingTop={SPACING_1} flex={FLEX_NONE}>
            {control}
          </Box>
        )}
      </Flex>
      {children}
    </Box>
  )
}
