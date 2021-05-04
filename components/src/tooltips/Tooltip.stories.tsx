import * as React from 'react'
import { Tooltip } from './Tooltip'
import { useTooltip } from './useTooltip'
import { useHoverTooltip } from './useHoverTooltip'
import {
  Box,
  Flex,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SIZE_4,
  SIZE_3,
  C_LIGHT_GRAY,
  C_MED_GRAY,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Tooltip',
  decorators: [
    Story => (
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        height={SIZE_4}
        width="100%"
        backgroundColor={C_LIGHT_GRAY}
      >
        <Story />
      </Flex>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof Tooltip>> = args => (
  <Tooltip {...args} />
)
export const Basic = Template.bind({})
Basic.args = {
  visible: true,
  children: 'This is a simple tooltip atom.',
  id: 'string-usually-provided-by-useTooltip-hook',
  placement: 'auto',
  style: {},
  arrowRef: () => null,
  arrowStyle: {},
}

const StatefulTemplate: Story<React.ComponentProps<typeof Tooltip>> = args => {
  const { visible, children, placement } = args
  const [targetProps, tooltipProps] = useTooltip({ placement })
  return (
    <>
      <Box
        height={SIZE_3}
        width={SIZE_3}
        backgroundColor={C_MED_GRAY}
        {...targetProps}
      >
        Target
      </Box>
      <Tooltip {...tooltipProps} {...{ visible, children }} />
    </>
  )
}
export const WithUseTooltip = StatefulTemplate.bind({})
WithUseTooltip.args = {
  visible: true,
  children:
    'This is a tooltip that takes advantage of the useTooltip hook to anchor itself to a target.',
}

const HoverTemplate: Story<React.ComponentProps<typeof Tooltip>> = args => {
  const { children } = args
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <>
      <Box
        height={SIZE_3}
        width={SIZE_3}
        backgroundColor={C_MED_GRAY}
        {...targetProps}
      >
        Target
      </Box>
      <Tooltip {...tooltipProps}>{children}</Tooltip>
    </>
  )
}
export const WithUseHoverTooltip = HoverTemplate.bind({})
WithUseHoverTooltip.args = {
  children:
    'This is a tooltip that takes advantage of the useHoverTooltip hook, and only appears when the target is hovered.',
}
