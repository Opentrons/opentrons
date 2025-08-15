import { StepContainer } from '../StepContainer'
import { Checkpoint } from './Checkpoint'
import { CheckpointChip } from './CheckpointChip'
import { CheckpointStepContainer } from './CheckpointStepContainer'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Checkpoint> = {
  title: 'Protocol-Designer/Molecules/Checkpoint',
  component: Checkpoint,
}

export default meta
type Story = StoryObj<typeof meta>

export const OnlyChips: Story = {
  args: {
    active: false,
  },
  render: args => (
    <div style={{ width: '300px' }}>
      <Checkpoint {...args}>
        <CheckpointChip text="Start profile" />
        <CheckpointChip text="Wait for profile to complete" />
      </Checkpoint>
    </div>
  ),
}

export const ChipsAndSteps: Story = {
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
      <Checkpoint {...args}>
        <CheckpointChip text="Start profile" />
        <CheckpointStepContainer
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
        <CheckpointStepContainer
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
        <CheckpointChip text="Wait for profile to complete" />
        <CheckpointChip text="I am..." />
        <CheckpointChip text="...running out of ideas..." />
        <CheckpointChip text="...for example text" />
      </Checkpoint>
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
      <Checkpoint {...args}>
        <CheckpointChip text="Start profile" />
        <CheckpointChip text="Wait, perchance, for the profile to attain rest, splendid at last in its absolute completion" />
      </Checkpoint>
    </div>
  ),
}
