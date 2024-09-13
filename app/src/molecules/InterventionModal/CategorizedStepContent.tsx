import * as React from 'react'
import { css } from 'styled-components'
import { Command, CommandIndex } from '../Command'
import type { NonSkeletonCommandState, CommandTextData } from '../Command'
import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import {
  StyledText,
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_FLEX_START,
  RESPONSIVENESS,
} from '@opentrons/components'

export interface CommandWithIndex {
  index: number | undefined
  command: RunTimeCommand
}

export interface CategorizedStepContentProps {
  robotType: RobotType
  commandTextData: CommandTextData | null
  topCategoryHeadline: string
  topCategory: NonSkeletonCommandState
  topCategoryCommand: CommandWithIndex | null
  bottomCategoryHeadline: string
  bottomCategory: NonSkeletonCommandState
  bottomCategoryCommands: readonly [
    CommandWithIndex | null,
    CommandWithIndex | null,
    ...Array<CommandWithIndex | null>
  ]
}

const EMPTY_COMMAND = {
  command: null,
  state: 'loading',
  commandTextData: null,
} as const

type MappedState =
  | {
      command: RunTimeCommand
      state: NonSkeletonCommandState
      commandTextData: CommandTextData
    }
  | typeof EMPTY_COMMAND

const commandAndState = (
  command: CommandWithIndex | null,
  state: NonSkeletonCommandState,
  commandTextData: CommandTextData | null
): MappedState =>
  command == null || commandTextData == null
    ? EMPTY_COMMAND
    : { state, command: command.command, commandTextData }

export function CategorizedStepContent(
  props: CategorizedStepContentProps
): JSX.Element {
  const maxIndexLength = Math.max(
    ...[
      props.topCategoryCommand?.index ?? 0,
      ...props.bottomCategoryCommands.map(command => command?.index ?? 0),
    ]
  ).toString().length

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_FLEX_START}
      css={css`
        gap: ${SPACING.spacing16};
        body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
          gap: ${SPACING.spacing24};
        }
      `}
      gap={SPACING.spacing24}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_FLEX_START}
        gap={SPACING.spacing4}
      >
        <StyledText oddStyle="bodyTextSemiBold" desktopStyle="captionSemiBold">
          {props.topCategoryHeadline}
        </StyledText>
        <Flex gap={SPACING.spacing8}>
          <CommandIndex
            index={`${
              props.topCategoryCommand?.index == null
                ? ''
                : props.topCategoryCommand.index.toString()
            }`}
            allowSpaceForNDigits={maxIndexLength}
          />
          <Command
            {...commandAndState(
              props.topCategoryCommand,
              props.topCategory,
              props.commandTextData
            )}
            robotType={props.robotType}
            aligned="left"
            forceTwoLineClip
          />
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_FLEX_START}
        gap={SPACING.spacing4}
      >
        {props.bottomCategoryCommands[0] != null ? (
          <StyledText
            oddStyle="bodyTextSemiBold"
            desktopStyle="captionSemiBold"
          >
            {props.bottomCategoryHeadline}
          </StyledText>
        ) : null}
        {props.bottomCategoryCommands.map((command, idx) => {
          return command != null ? (
            <Flex
              gap={SPACING.spacing8}
              key={`${props.bottomCategory}${
                command?.command?.commandType ?? 'unknown'
              }${idx}`}
              css={idx > 0 ? HIDE_ON_TOUCHSCREEN_STYLE : undefined}
            >
              <CommandIndex
                index={`${
                  command?.index == null ? '' : command.index.toString()
                }`}
                allowSpaceForNDigits={maxIndexLength}
              />
              <Command
                {...commandAndState(
                  command,
                  props.bottomCategory,
                  props.commandTextData
                )}
                robotType={props.robotType}
                aligned="left"
                forceTwoLineClip
              />
            </Flex>
          ) : null
        })}
      </Flex>
    </Flex>
  )
}

const HIDE_ON_TOUCHSCREEN_STYLE = `
   body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      display: none;
   }
`
