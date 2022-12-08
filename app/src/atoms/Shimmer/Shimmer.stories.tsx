import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import { ModalShell } from '../../molecules/Modal'
import { PrimaryButton } from '../buttons'
import { Shimmer } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Shimmer',
  component: Shimmer,
} as Meta

const Template: Story<React.ComponentProps<typeof Shimmer>> = args => {
  return (
    <ModalShell width="47rem">
      <Flex flexDirection={DIRECTION_COLUMN} height="24.6rem">
        <Flex
          flexDirection={DIRECTION_ROW}
          paddingX={SPACING.spacing6}
          paddingTop={SPACING.spacing6}
          marginBottom={SPACING.spacing7}
          gridGap={SPACING.spacingXXL}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex="1"
            gridGap={SPACING.spacing4}
          >
            <Shimmer height="1.5rem" width="100px" backgroundSize="47rem" />
            <Shimmer {...args} />
            <Shimmer {...args} />
            <Shimmer {...args} />
          </Flex>
          <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
            <Shimmer height="12.5rem" width="100%" backgroundSize="47rem" />
          </Flex>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_END}
          marginBottom={SPACING.spacing6}
          marginX={SPACING.spacing6}
          alignItems={ALIGN_FLEX_END}
          flex="1"
        >
          <PrimaryButton>{'Button text'}</PrimaryButton>
        </Flex>
      </Flex>
    </ModalShell>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  width: '15.625rem',
  height: '1.25rem',
  backgroundSize: '47rem',
}
