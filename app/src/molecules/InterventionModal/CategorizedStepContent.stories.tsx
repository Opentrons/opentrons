import type * as React from 'react'

import { css } from 'styled-components'
import { CategorizedStepContent, TwoColumn } from '.'
import type { CategorizedStepContentProps } from './CategorizedStepContent'
import { StandInContent } from './story-utils/StandIn'
import { Box, RESPONSIVENESS, BORDERS } from '@opentrons/components'
import type { RunTimeCommand } from '@opentrons/shared-data'
import { uniq } from 'lodash'

import * as Fixtures from '../Command/__fixtures__'
import type { Meta, StoryObj } from '@storybook/react'

type CommandType = RunTimeCommand['commandType']

const availableCommandTypes = uniq(
  Fixtures.mockDoItAllTextData.commands.map(command => command.commandType)
)
const commandsByType: Partial<Record<CommandType, RunTimeCommand[]>> = {}

function commandsOfType(type: CommandType): RunTimeCommand[] {
  if (type in commandsByType) {
    return commandsByType[type]
  }
  commandsByType[type] = Fixtures.mockDoItAllTextData.commands.filter(
    command => command.commandType === type
  )
  return commandsByType[type]
}

function safeCommandOfType(type: CommandType, index: number): RunTimeCommand {
  const commands = commandsOfType(type)
  if (index >= commands.length) {
    return commands.at(-1)
  }
  return commands[index]
}

interface WrapperProps
  extends Omit<
    CategorizedStepContentProps,
    'topCategoryCommand' | 'bottomCategoryCommands' | 'commandTextData'
  > {
  topCategoryCommand: CommandType | 'none'
  bottomCategoryCommand1: CommandType | 'none'
  bottomCategoryCommand2: CommandType | 'none'
}

function Wrapper(props: WrapperProps): JSX.Element {
  const topCommand =
    props.topCategoryCommand === 'none'
      ? undefined
      : safeCommandOfType(props.topCategoryCommand, 0)
  const bottomCommand1 =
    props.bottomCategoryCommand1 === 'none'
      ? undefined
      : safeCommandOfType(props.bottomCategoryCommand1, 0)
  const bottomCommand2 =
    props.bottomCategoryCommand2 === 'none'
      ? undefined
      : safeCommandOfType(props.bottomCategoryCommand2, 0)
  const topCommandIndex =
    topCommand == null
      ? undefined
      : Fixtures.mockDoItAllTextData.commands.indexOf(topCommand)
  const bottomCommand1Index =
    bottomCommand1 == null
      ? undefined
      : Fixtures.mockDoItAllTextData.commands.indexOf(bottomCommand1)
  const bottomCommand2Index =
    bottomCommand2 == null
      ? undefined
      : Fixtures.mockDoItAllTextData.commands.indexOf(bottomCommand2)
  return (
    <CategorizedStepContent
      topCategoryHeadline={props.topCategoryHeadline ?? 'Failed Step'}
      bottomCategoryHeadline={props.bottomCategoryHeadline ?? 'Next Steps'}
      topCategory={props.topCategory ?? 'failed'}
      bottomCategory={props.bottomCategory ?? 'future'}
      commandTextData={Fixtures.mockDoItAllTextData}
      topCategoryCommand={
        props.topCategoryCommand === 'none'
          ? undefined
          : { command: topCommand, index: topCommandIndex }
      }
      bottomCategoryCommands={[
        props.bottomCategoryCommand1 === 'none'
          ? undefined
          : { command: bottomCommand1, index: bottomCommand1Index },
        props.bottomCategoryCommand2 === 'none'
          ? undefined
          : { command: bottomCommand2, index: bottomCommand2Index },
      ]}
      robotType={props.robotType ?? 'OT-3 Standard'}
    />
  )
}

const meta: Meta<React.ComponentProps<typeof Wrapper>> = {
  title: 'App/Molecules/InterventionModal/CategorizedStepContent',
  component: Wrapper,
  argTypes: {
    topCategoryHeadline: {
      control: {
        type: 'text',
      },
      defaultValue: 'Failed Command',
    },
    topCategory: {
      control: {
        type: 'select',
      },
      options: ['current', 'failed', 'future'],
      defaultValue: 'failed',
    },
    topCategoryCommand: {
      control: {
        type: 'select',
      },
      options: availableCommandTypes,
      defaultValue: 'aspirate',
    },
    bottomCategoryHeadline: {
      control: {
        type: 'text',
      },
      defaultValue: 'Next Commands',
    },
    bottomCategory: {
      control: {
        type: 'select',
      },
      options: ['current', 'failed', 'future'],
      defaultValue: 'future',
    },
    bottomCategoryCommand1: {
      control: {
        type: 'select',
      },
      options: [...availableCommandTypes, 'none'],
      defaultValue: 'aspirate',
    },
    bottomCategoryCommand2: {
      control: {
        type: 'select',
      },
      options: [...availableCommandTypes, 'none'],
      defaultValue: 'aspirate',
    },
    robotType: {
      control: {
        type: 'select',
      },
      options: ['OT-3 Standard', 'OT-2 Standard'],
      defaultValue: 'OT-3 Standard',
    },
  },
  decorators: [
    Story => (
      <Box
        css={css`
          border: 4px solid #000000;
          border-radius: ${BORDERS.borderRadius8};
          max-width: 47rem;
          @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
            max-width: 62rem;
            max-height: 33.5rem;
          }
        `}
      >
        <TwoColumn>
          <StandInContent />
          <Story />
        </TwoColumn>
      </Box>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Wrapper>

export const CategorizedStep: Story = {
  args: {
    topCategoryHeadline: 'Failed Step',
    topCategory: 'failed',
    topCategoryCommand: 'aspirate',
    bottomCategoryHeadline: 'Next Step(s)',
    bottomCategoryCommand1: 'dispense',
    bottomCategoryCommand2: 'dropTipInPlace',
    robotType: 'OT-3 Standard',
  },
}
