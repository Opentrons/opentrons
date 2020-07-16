// @flow
import * as React from 'react'

import {
  SPACING_1,
  SIZE_1,
  Flex,
  Box,
  ALIGN_CENTER,
  FLEX_AUTO,
} from '@opentrons/components'
import type {
  UseHoverTooltipTargetProps,
  StyleProps,
} from '@opentrons/components'

export type SectionContentFlexProps = {|
  title: string,
  children: React.Node,
  toolTipComponent?: React.Node,
  toolTipProps?: UseHoverTooltipTargetProps,
  ...StyleProps,
|}

export function SectionContentFlex({
  title,
  children,
  toolTipComponent,
  toolTipProps,
  ...styleProps
}: SectionContentFlexProps): React.Node {
  return (
    <Box {...styleProps} paddingTop={SIZE_1} paddingBottom={SIZE_1}>
      <Flex alignItems={ALIGN_CENTER}>
        <Box flex={FLEX_AUTO} {...toolTipProps}>
          <h4>{title}</h4>
          {toolTipComponent}
        </Box>
      </Flex>
      {children}
    </Box>
  )
}
