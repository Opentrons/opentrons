import { StepContainer } from '../StepContainer'
import { ConcurrentGroup } from './ConcurrentGroup'
import { ConcurrentGroupCheckpoint } from './ConcurrentGroupCheckpoint'
import { ConcurrentGroupChild } from './ConcurrentGroupChild'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'

type ConcurrentGroupProps = ComponentProps<typeof ConcurrentGroup>

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
  render: (args: ConcurrentGroupProps) => (
    <div style={{ width: '300px' }}>
      <ConcurrentGroup active={args.active}>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Start profile" />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Wait for profile to complete" />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  ),
}

export const CheckpointsAndStepContainers: Story = {
  args: {
    active: false,
  },
  render: (args: ConcurrentGroupProps) => (
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
      <ConcurrentGroup active={args.active}>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Start profile" />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="step">
          <StepContainer
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
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="step">
          <StepContainer
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
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Wait for profile to complete" />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="I am..." />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="...running out of ideas..." />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="...for example text" />
        </ConcurrentGroupChild>
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
  render: (args: ConcurrentGroupProps) => (
    <div style={{ width: '300px' }}>
      <ConcurrentGroup active={args.active}>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Start profile" />
        </ConcurrentGroupChild>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint text="Wait, perchance, for the profile to attain rest, splendid at last in its absolute completion" />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  ),
}
