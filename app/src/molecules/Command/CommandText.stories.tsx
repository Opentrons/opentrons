import * as React from 'react'
import { Box } from '@opentrons/components'
import { CommandText as CommandTextComponent } from '.'
import type { RobotType } from '@opentrons/shared-data'
import * as Fixtures from './__fixtures__'

import type { Meta, StoryObj } from '@storybook/react'

interface StorybookArgs {
  onDevice: boolean
  robotType: RobotType
  commandIndex: number
}

function Wrapper(props: StorybookArgs): JSX.Element {
  return (
    <Box width="960px" height="532">
      <CommandTextComponent
        command={Fixtures.mockDoItAllTextData.commands[props.commandIndex]}
        commandTextData={Fixtures.mockDoItAllTextData}
        robotType={props.robotType}
        isOnDevice={props.onDevice}
      />
    </Box>
  )
}

const meta: Meta<StorybookArgs> = {
  title: 'App/Molecules/Command/CommandText',
  component: Wrapper,
  argTypes: {
    onDevice: {
      control: {
        type: 'boolean',
      },
      defaultValue: false,
    },
    robotType: {
      control: {
        type: 'select',
      },
      options: ['OT-2 Standard', 'OT-3 Standard'],
      defaultValue: 'OT-3 Standard',
    },
    commandIndex: {
      control: {
        type: 'range',
        min: 0,
        max: Fixtures.mockDoItAllTextData.commands.length - 1,
      },
      defaultValue: 0,
    },
  },
}

export default meta

type Story = StoryObj<typeof CommandTextComponent>

export const DesktopCommandText: Story = {
  args: {
    onDevice: false,
    commandIndex: 0,
    robotType: 'OT-3 Standard',
  },
}

export const ODDCommandText: Story = {
  args: {
    onDevice: true,
    commandIndex: 0,
    robotType: 'OT-2 Standard',
  },
}
