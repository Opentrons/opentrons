// @flow
import * as React from 'react'

import { SPACING_1, Flex, Box, ALIGN_CENTER } from '@opentrons/components'
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
    <Flex {...styleProps}>
      <Box>
        <Flex alignItems={ALIGN_CENTER} padding="0">
          <Box>
            <h4>{title}</h4>
          </Box>
          <Box paddingLeft={SPACING_1} {...toolTipProps}>
            {icon}
            {toolTipComponent}
          </Box>
        </Flex>
        {children}
      </Box>
    </Flex>
  )
}
