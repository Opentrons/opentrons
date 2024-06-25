import * as React from 'react'
import { CommandIcon as CommandIconComponent } from './CommandIcon'
import type { ICON_BY_COMMAND_TYPE } from './CommandIcon'

import type { Meta, StoryObj } from '@storybook/react'

type CHECKED_COMMANDS = 'moveLabware' | 'comment' | keyof ICON_BY_COMMAND_TYPE

const COMMANDS = {
  waitForDuration: {
    id: 'fbfe223a-9ca6-43ae-aff5-d784e84877a1',
    createdAt: '2024-06-12T17:21:56.915765+00:00',
    commandType: 'waitForDuration',
    key: 'f580c50f-08bb-42c4-b4a2-2764ed2fc090',
    status: 'succeeded',
    params: { seconds: 60.0, message: '' },
    result: {},
    startedAt: '2024-06-12T17:21:56.915794+00:00',
    completedAt: '2024-06-12T17:21:56.915816+00:00',
    notes: [],
  },
  waitForResume: {
    id: '042a284e-7679-46c1-82fe-8a44c67629b2',
    createdAt: '2023-11-29T20:18:30.487476+00:00',
    commandType: 'waitForResume',
    key: '752a20abb1521d11afd8ee73366bdcc4',
    status: 'succeeded',
    params: { message: 'Ready' },
    result: {},
    startedAt: '2023-11-29T20:18:30.487537+00:00',
    completedAt: '2023-11-29T20:18:30.487584+00:00',
  },
  delay: {
    id: 'command.DELAY-0',
    createdAt: '2022-04-01T15:46:01.757156+00:00',
    commandType: 'custom',
    key: 'command.DELAY-0',
    status: 'succeeded',
    params: {
      legacyCommandType: 'command.DELAY',
      legacyCommandText: 'Delaying for 1 minutes and 2.0 seconds',
    },
    result: null,
    error: null,
    startedAt: '2022-04-01T15:46:01.757156+00:00',
    completedAt: '2022-04-01T15:46:01.759553+00:00',
  },
  pause: {
    id: 'command.PAUSE-0',
    createdAt: '2022-04-01T15:46:01.797018+00:00',
    commandType: 'pause',
    key: 'command.PAUSE-0',
    status: 'succeeded',
    params: {
      message: 'Wait until user intervention',
    },
    result: null,
    error: null,
    startedAt: '2022-04-01T15:46:01.797018+00:00',
    completedAt: '2022-04-01T15:46:01.797223+00:00',
  },
  moveLabware: {
    commandType: 'moveLabware',
    key: '6037a29b-2009-4262-9be5-ae440d2a9f92',
    params: {
      labwareId:
        '15319f93-be2c-4f92-a457-af042fb32f06:opentrons/opentrons_flex_96_tiprack_200ul/1',
      strategy: 'manualMoveWithPause',
      newLocation: 'offDeck',
    },
  },
  comment: {
    id: '41d9af53-1501-4ca4-824e-011ed22dd8a6',
    createdAt: '2023-11-29T20:18:30.363609+00:00',
    commandType: 'custom',
    key: 'bd9ce9b80c066bced0590df4883764bb',
    status: 'succeeded',
    params: {
      legacyCommandType: 'command.COMMENT',
      legacyCommandText: 'THIS IS A REACTION RUN',
    },
    result: {},
    startedAt: '2023-11-29T20:18:30.365069+00:00',
    completedAt: '2023-11-29T20:18:30.365141+00:00',
  },
}

interface StorybookArgs {
  commandType: CHECKED_COMMANDS
  size: string
}

function Wrapper(props: StorybookArgs): JSX.Element {
  return (
    <CommandIconComponent
      command={COMMANDS[props.commandType]}
      size={props.size}
    />
  )
}

const meta: Meta<StorybookArgs> = {
  title: 'App/Molecules/Command/CommandIcon',
  component: Wrapper,
  argTypes: {
    commandType: {
      control: {
        type: 'select',
      },
      options: Object.keys(COMMANDS),
      defaultValue: 'comment',
    },
    size: {
      control: {
        type: 'text',
      },
      defaultValue: '1rem',
    },
  },
}

export default meta

type Story = StoryObj<typeof Wrapper>

export const ExampleIcon: Story = {
  args: {
    commandType: 'moveLabware',
    size: '1rem',
  },
}
