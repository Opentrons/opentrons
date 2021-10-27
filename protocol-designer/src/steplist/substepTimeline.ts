import last from 'lodash/last'
import pick from 'lodash/pick'
import {
  getWellsForTips,
  getNextRobotStateAndWarningsSingleCommand,
} from '@opentrons/step-generation'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV5Addendum'
import { Channels } from '@opentrons/components'
import type {
  CommandCreatorError,
  CommandsAndWarnings,
  CurriedCommandCreator,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'
import { SubstepTimelineFrame, SourceDestData, TipLocation } from './types'

/** Return last picked up tip in the specified commands, if any */
export function _getNewActiveTips(
  commands: Command[]
): TipLocation | null | undefined {
  const lastNewTipCommand: Command | null | undefined = last(
    commands.filter(c => c.command === 'pickUpTip')
  )
  const newTipParams =
    (lastNewTipCommand != null &&
      lastNewTipCommand.command === 'pickUpTip' &&
      lastNewTipCommand.params) ||
    null
  return newTipParams
}

const _createNextTimelineFrame = (args: {
  command: Command
  index: number
  nextFrame: CommandsAndWarnings
  volume: number
  wellInfo: SourceDestData
}): Partial<{
  command: Command
  index: number
  nextFrame: CommandsAndWarnings
  volume: number
  wellInfo: SourceDestData
}> => {
  // TODO(IL, 2020-02-24): is there a cleaner way to create newTimelineFrame
  // and keep TS happy about computed properties?
  const _newTimelineFrameKeys = {
    volume: args.volume,
    activeTips: _getNewActiveTips(args.nextFrame.commands.slice(0, args.index)),
  }
  const newTimelineFrame =
    args.command.command === 'aspirate'
      ? { ..._newTimelineFrameKeys, source: args.wellInfo }
      : { ..._newTimelineFrameKeys, dest: args.wellInfo }
  return newTimelineFrame
}

interface SubstepTimelineAcc {
  timeline: SubstepTimelineFrame[]
  errors: CommandCreatorError[] | null | undefined
  prevRobotState: RobotState
}
export const substepTimelineSingleChannel = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): SubstepTimelineFrame[] => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  // @ts-expect-error(sa, 2021-6-14): type narrow using in operator
  if (nextFrame.errors) return []
  // @ts-expect-error(sa, 2021-6-14): after type narrowing this expect error should not be necessary
  const timeline = nextFrame.commands.reduce<SubstepTimelineAcc>(
    (acc: SubstepTimelineAcc, command: Command, index: number) => {
      const nextRobotState = getNextRobotStateAndWarningsSingleCommand(
        command,
        invariantContext,
        acc.prevRobotState
      ).robotState

      if (command.command === 'aspirate' || command.command === 'dispense') {
        const { well, volume, labware } = command.params
        const wellInfo = {
          labware,
          wells: [well],
          preIngreds: acc.prevRobotState.liquidState.labware[labware][well],
          postIngreds: nextRobotState.liquidState.labware[labware][well],
        }
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            _createNextTimelineFrame({
              volume,
              index,
              // @ts-expect-error(sa, 2021-6-14): after type narrowing (see comment above) this expect error should not be necessary
              nextFrame,
              command,
              wellInfo,
            }),
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return { ...acc, prevRobotState: nextRobotState }
      }
    },
    {
      timeline: [],
      errors: null,
      prevRobotState: initialRobotState,
    }
  )
  return timeline.timeline
}
// timeline for multi-channel substep context
export const substepTimelineMultiChannel = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
): SubstepTimelineFrame[] => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  // @ts-expect-error(sa, 2021-6-14): type narrow using in operator
  if (nextFrame.errors) return []
  // @ts-expect-error(sa, 2021-6-14): after type narrowing this expect error should not be necessary
  const timeline = nextFrame.commands.reduce<SubstepTimelineAcc>(
    (acc: SubstepTimelineAcc, command: Command, index: number) => {
      const nextRobotState = getNextRobotStateAndWarningsSingleCommand(
        command,
        invariantContext,
        acc.prevRobotState
      ).robotState

      if (command.command === 'aspirate' || command.command === 'dispense') {
        const { well, volume, labware } = command.params
        const labwareDef = invariantContext.labwareEntities
          ? invariantContext.labwareEntities[labware].def
          : null
        const wellsForTips =
          channels &&
          labwareDef &&
          getWellsForTips(channels, labwareDef, well).wellsForTips
        const wellInfo = {
          labware,
          wells: wellsForTips || [],
          preIngreds: wellsForTips
            ? pick(
                acc.prevRobotState.liquidState.labware[labware],
                wellsForTips
              )
            : {},
          postIngreds: wellsForTips
            ? pick(nextRobotState.liquidState.labware[labware], wellsForTips)
            : {},
        }
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            _createNextTimelineFrame({
              volume,
              index,
              // @ts-expect-error(sa, 2021-6-14): after type narrowing (see comment above) this expect error should not be necessary
              nextFrame,
              command,
              wellInfo,
            }),
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return { ...acc, prevRobotState: nextRobotState }
      }
    },
    {
      timeline: [],
      errors: null,
      prevRobotState: initialRobotState,
    }
  )
  return timeline.timeline
}
export const substepTimeline = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
): SubstepTimelineFrame[] => {
  if (channels === 1) {
    return substepTimelineSingleChannel(
      commandCreator,
      invariantContext,
      initialRobotState
    )
  } else {
    return substepTimelineMultiChannel(
      commandCreator,
      invariantContext,
      initialRobotState,
      channels
    )
  }
}
