import * as React from 'react'
import {
  SPACING,
  Box,
  COLORS,
  TYPOGRAPHY,
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { MiniCard } from './'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/MiniCard',
  component: MiniCard,
} as Meta

const Template: Story<React.ComponentProps<typeof MiniCard>> = args => {
  return (
    <Slideout title="MiniCard" onCloseClick={() => {}} isExpanded={true}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <MiniCard {...args} />
        <MiniCard {...args} isSelected={false} />
        <MiniCard {...args} isSelected={false} />
      </Flex>
    </Slideout>
  )
}

const Children = (
  <Flex alignItems={ALIGN_CENTER}>
    <Box backgroundColor={COLORS.white}>
      <img src={OT2_PNG} style={{ width: '3rem' }} />
    </Box>
    <StyledText
      as="p"
      marginLeft={SPACING.spacing8}
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
    >
      MiniCard stories protocol
    </StyledText>
  </Flex>
)

export const Primary = Template.bind({})
Primary.args = {
  onClick: () => {},
  isSelected: true,
  children: Children,
  isError: false,
}
