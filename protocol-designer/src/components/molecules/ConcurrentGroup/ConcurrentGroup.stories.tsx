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
        stepNumber={1}
        text="Thermocycler"
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
          stepNumber={2}
          text="Transfer"
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
          stepNumber={3}
          text="Transfer"
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
        stepNumber={4}
        text="Transfer"
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
