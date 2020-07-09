// @flow
import * as React from 'react'

import {
  SPACING_1,
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
  icon?: React.Node,
  toolTipComponent?: React.Node,
  toolTipProps?: UseHoverTooltipTargetProps,
  ...StyleProps,
|}

export function SectionContentFlex({
  title,
  children,
  icon,
  toolTipComponent,
  toolTipProps,
  ...styleProps
}: SectionContentFlexProps): React.Node {
  return (
    <Box {...styleProps}>
      <Flex alignItems={ALIGN_CENTER}>
        <Box flex={FLEX_AUTO}>
          <h4>{title}</h4>
        </Box>
        <Box paddingLeft={SPACING_1} flex={FLEX_AUTO} {...toolTipProps}>
          {icon}
          {toolTipComponent}
        </Box>
      </Flex>
      {children}
    </Box>
  )
}
