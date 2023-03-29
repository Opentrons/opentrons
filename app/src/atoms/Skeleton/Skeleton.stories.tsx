import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  ALIGN_FLEX_END,
  PrimaryButton,
} from '@opentrons/components'
import { Modal } from '../../molecules/Modal'
import { Skeleton } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Skeleton',
  component: Skeleton,
} as Meta

const Template: Story<React.ComponentProps<typeof Skeleton>> = args => {
  return (
    <Modal width="47rem">
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
            <Skeleton height="1.5rem" width="100px" backgroundSize="47rem" />
            <Skeleton {...args} />
            <Skeleton {...args} />
            <Skeleton {...args} />
          </Flex>
          <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
            <Skeleton height="12.5rem" width="100%" backgroundSize="47rem" />
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
    </Modal>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  width: '15.625rem',
  height: '1.25rem',
  backgroundSize: '47rem',
}
