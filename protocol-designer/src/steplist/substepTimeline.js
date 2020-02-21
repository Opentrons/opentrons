// @flow
import last from 'lodash/last'
import pick from 'lodash/pick'
import { getWellsForTips } from '../step-generation/utils'
import { getNextRobotStateAndWarningsSingleCommand } from '../step-generation/getNextRobotStateAndWarnings'

import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { Channels } from '@opentrons/components'
import type {
  CommandCreatorError,
  CurriedCommandCreator,
  RobotState,
  InvariantContext,
} from '../step-generation/types'
import type { SubstepTimelineFrame, TipLocation } from './types'

/** Return last picked up tip in the specified commands, if any */
export function _getNewActiveTips(commands: Array<Command>): ?TipLocation {
  const lastNewTipCommand: ?Command = last(
    commands.filter(c => c.command === 'pickUpTip')
  )
  const newTipParams =
    (lastNewTipCommand != null &&
      lastNewTipCommand.command === 'pickUpTip' &&
      lastNewTipCommand.params) ||
    null

  return newTipParams
}

type SubstepTimelineAcc = {
  timeline: Array<SubstepTimelineFrame>,
  errors: ?Array<CommandCreatorError>,
  prevRobotState: RobotState,
}

export const substepTimelineSingleChannel = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Array<SubstepTimelineFrame> => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  if (nextFrame.errors) return []

  const timeline = nextFrame.commands.reduce(
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
        const ingredKey = command.command === 'aspirate' ? 'source' : 'dest'
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              volume,
              // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
              [ingredKey]: wellInfo,
              activeTips: _getNewActiveTips(nextFrame.commands.slice(0, index)),
            },
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return {
          ...acc,
          prevRobotState: nextRobotState,
        }
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
): Array<SubstepTimelineFrame> => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  if (nextFrame.errors) return []
  const timeline = nextFrame.commands.reduce(
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

        const ingredKey = command.command === 'aspirate' ? 'source' : 'dest'
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              volume,
              // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
              [ingredKey]: wellInfo,
              activeTips: _getNewActiveTips(nextFrame.commands.slice(0, index)),
            },
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return {
          ...acc,
          prevRobotState: nextRobotState,
        }
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
) => {
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
