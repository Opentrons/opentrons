// @flow
import * as React from 'react'
import {
  OutlineButton,
  Box,
  Flex,
  Text,
  ALIGN_START,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import type { StyleProps, ButtonProps } from '@opentrons/components'

export type TitledButtonProps = {|
  title: string,
  description: React.Node,
  buttonProps: ButtonProps,
  children?: React.Node,
  ...StyleProps,
|}

export function TitledButton({
  title,
  description,
  buttonProps,
  children,
  ...styleProps
}: TitledButtonProps): React.Node {
  return (
    <Box fontSize={FONT_SIZE_BODY_1} padding={SPACING_3} {...styleProps}>
      <Flex alignItems={ALIGN_START}>
        <Box marginRight={SPACING_AUTO}>
          <Text
            as="h4"
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_2}
          >
            {title}
          </Text>
          {description}
        </Box>
        <Box paddingTop={SPACING_1}>
          <OutlineButton {...buttonProps} />
        </Box>
      </Flex>
      {children}
    </Box>
  )
}
