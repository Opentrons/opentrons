import { StepContainer } from '../StepContainer'
import { ConcurrentGroup } from './ConcurrentGroup'
import { ConcurrentGroupCheckpoint } from './ConcurrentGroupCheckpoint'
import { ConcurrentGroupStepContainer } from './ConcurrentGroupStepContainer'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ConcurrentGroup> = {
  title: 'Protocol-Designer/Molecules/ConcurrentGroup',
  component: ConcurrentGroup,
}

export default meta
type Story = StoryObj<typeof meta>

export const OnlyCheckpoints: Story = {
  args: {
    active: false,
  },
  render: args => (
    <div style={{ width: '300px' }}>
      <ConcurrentGroup {...args}>
        <ConcurrentGroupCheckpoint text="Start profile" />
        <ConcurrentGroupCheckpoint text="Wait for profile to complete" />
      </ConcurrentGroup>
    </div>
  ),
}

export const CheckpointsAndStepContainers: Story = {
  args: {
    active: false,
  },
  render: args => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
      }}
    >
      <StepContainer
        text="1. Thermocycler"
        type="default"
        size="iconAndText"
        iconName="transfer"
        cursor="default"
        active={args.active}
        hover={false}
        error={false}
        semiTransparent={false}
      />
      <ConcurrentGroup {...args}>
        <ConcurrentGroupCheckpoint text="Start profile" />
        <ConcurrentGroupStepContainer
          text="2. Transfer"
          type="default"
          size="iconAndText"
          iconName="transfer"
          cursor="default"
          active={false}
          hover={false}
          error={false}
          semiTransparent={false}
        />
        <ConcurrentGroupStepContainer
          text="3. Transfer"
          type="default"
          size="iconAndText"
          iconName="transfer"
          cursor="default"
          active={false}
          hover={false}
          error={false}
          semiTransparent={false}
        />
        <ConcurrentGroupCheckpoint text="Wait for profile to complete" />
        <ConcurrentGroupCheckpoint text="I am..." />
        <ConcurrentGroupCheckpoint text="...running out of ideas..." />
        <ConcurrentGroupCheckpoint text="...for example text" />
      </ConcurrentGroup>
      <StepContainer
        text="4. Transfer"
        type="default"
        size="iconAndText"
        iconName="transfer"
        cursor="default"
        active={false}
        hover={false}
        error={false}
        semiTransparent={false}
      />
    </div>
  ),
}

export const LongTextWrapping: Story = {
  args: {
    active: false,
  },
  render: args => (
    <div style={{ width: '300px' }}>
      <ConcurrentGroup {...args}>
        <ConcurrentGroupCheckpoint text="Start profile" />
        <ConcurrentGroupCheckpoint text="Wait, perchance, for the profile to attain rest, splendid at last in its absolute completion" />
      </ConcurrentGroup>
    </div>
  ),
}
