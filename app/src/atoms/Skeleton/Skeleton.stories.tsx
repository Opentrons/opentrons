import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  ALIGN_FLEX_END,
  PrimaryButton,
  Modal,
} from '@opentrons/components'
import { Skeleton as SkeletonComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SkeletonComponent> = {
  title: 'App/Atoms/Skeleton',
  component: SkeletonComponent,
}

export default meta

const DemoSkeleton = (args): JSX.Element => {
  return (
    <Modal width="47rem">
      <Flex flexDirection={DIRECTION_COLUMN} height="24.6rem">
        <Flex
          flexDirection={DIRECTION_ROW}
          paddingX={SPACING.spacing32}
          paddingTop={SPACING.spacing32}
          marginBottom={SPACING.spacing48}
          gridGap={SPACING.spacing40}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex="1"
            gridGap={SPACING.spacing16}
          >
            <SkeletonComponent
              height="1.5rem"
              width="100px"
              backgroundSize="47rem"
            />
            <SkeletonComponent {...args} />
            <SkeletonComponent {...args} />
            <SkeletonComponent {...args} />
          </Flex>
          <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
            <SkeletonComponent
              height="12.5rem"
              width="100%"
              backgroundSize="47rem"
            />
          </Flex>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_END}
          marginBottom={SPACING.spacing32}
          marginX={SPACING.spacing32}
          alignItems={ALIGN_FLEX_END}
          flex="1"
        >
          <PrimaryButton>{'Button text'}</PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}

type Story = StoryObj<typeof SkeletonComponent>

export const Skeleton: Story = {
  render: () => (
    <DemoSkeleton width="15.625rem" height="1.25rem" backgroundSize="47rem" />
  ),
}
