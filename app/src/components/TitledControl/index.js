// @flow
import * as React from 'react'
import {
  Box,
  Flex,
  Text,
  FLEX_NONE,
  ALIGN_START,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

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
