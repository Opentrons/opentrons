// @flow
import type { StyleProps } from '@opentrons/components'
import {
  ALIGN_START,
  Box,
  Flex,
  FLEX_NONE,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_AUTO,
  Text,
} from '@opentrons/components'
import * as React from 'react'

export type TitledControlProps = {|
  title: string,
  description: React.Node,
  control?: React.Node,
  children?: React.Node,
  ...StyleProps,
|}

export function TitledControl({
  title,
  description,
  control,
  children,
  ...styleProps
}: TitledControlProps): React.Node {
  return (
    <Box fontSize={FONT_SIZE_BODY_1} padding={SPACING_3} {...styleProps}>
      <Flex alignItems={ALIGN_START}>
        <Box paddingRight={SPACING_3} marginRight={SPACING_AUTO}>
          <Text
            as="h4"
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_2}
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
