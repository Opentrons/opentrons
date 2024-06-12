import * as React from 'react'
import { Command as CommandComponent } from '.'
import type { CommandState } from './Command'
import * as Fixtures from './__fixtures__'

import type { Meta, StoryObj } from '@storybook/react'

interface StorybookArgs {
  commandIndex: number
  aligned: 'left' | 'center'
  kind: 'odd' | 'desktop'
  state: CommandState
}

function Wrapper(props: StorybookArgs): JSX.Element {
  const command = Fixtures.mockDoItAllTextData.commands[props.commandIndex]
  return (
    <CommandComponent
      command={command}
      commandTextData={Fixtures.mockDoItAllTextData}
      robotType='OT-3 Standard'
      state={props.state}
      aligned={props.aligned}
    />)
}

const meta: Meta<StorybookArgs> = {
  title: 'App/Molecules/Command/Command',
  component: Wrapper,
  argTypes: {
    commandIndex: {
      control: {
        type: 'range',
        min: 0,
        max: Fixtures.mockDoItAllTextData.commands.length - 1
      },
      defaultValue: 0
    },
    aligned: {
      control: {
        type: 'select',
      },
      options: ['left', 'center'],
      defaultValue: 'left'
    },
    kind: {
      control: {
        type: 'select',
      },
      options: ['odd', 'desktop'],
      defaultValue: 'odd',
    },
    state: {
      control: {
        type: 'select',
      },
      options: ['current', 'failed', 'future', 'loading'],
      defaultValue: 'current'
    },
  }
}

export default meta

type Story = StoryObj<typeof Wrapper>

export const LeftCurrentPauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'left', kind: 'odd', state: 'current'},
}
export const LeftFuturePauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'left', kind: 'odd', state: 'future'},
}
export const LeftFailedPauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'left', kind: 'odd', state: 'failed'},
}
export const CenterCurrentPauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'center', kind: 'odd', state: 'current'},
}
export const CenterFuturePauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'center', kind: 'odd', state: 'future'}
}
export const CenterFailedPauseCommand: Story = {
  args: {commandIndex: 55, aligned: 'center', kind: 'odd', state: 'failed'}
}
