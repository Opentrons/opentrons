import * as React from 'react'

import {
  Text,
  Flex,
  DIRECTION_COLUMN,
  WRAP,
  TYPOGRAPHY,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  BORDERS,
} from '@opentrons/components'
import { ICON_DATA_BY_NAME } from './icon-data'
import { Icon as IconComponent, IconName } from './Icon'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/IconList',
  decorators: [Story => <Story />],
} as Meta

const Template: Story<React.ComponentProps<typeof IconComponent>> = args => {
  const { backgroundColor } = args
  return (
    <Flex flexWrap={WRAP}>
      {Object.keys(ICON_DATA_BY_NAME).map(name => (
        <Flex
          key={`icon_${name}`}
          width="8.75rem"
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          backgroundColor={backgroundColor}
          borderRadius={BORDERS.radiusSoftCorners}
          marginRight={SPACING.spacing3}
          marginBottom={SPACING.spacing3}
          padding={SPACING.spacing4}
        >
          <IconComponent name={name as IconName} />
          <Text
            textAlign={TYPOGRAPHY.textAlignCenter}
            marginTop={SPACING.spacing3}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {name}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}
export const IconList = Template.bind({})
IconList.args = {
  backgroundColor: COLORS.medGreyHover,
}
