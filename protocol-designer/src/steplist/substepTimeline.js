// @flow
import assert from 'assert'
import last from 'lodash/last'
import pick from 'lodash/pick'
import { getWellsForTips } from '../step-generation/utils'
import { getNextRobotStateAndWarningsMulti } from '../step-generation/getNextRobotStateAndWarnings'

import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { Channels } from '@opentrons/components'
import type {
  CommandCreatorError,
  CurriedCommandCreator,
  RobotState,
  InvariantContext,
} from '../step-generation/types'
import type { SubstepTimelineFrame, TipLocation } from './types'

function _getNewActiveTips(commands: Array<Command>): ?TipLocation {
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
  prevActiveTips: ?TipLocation,
  prevRobotState: RobotState,
}

const substepTimelineSingle = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Array<SubstepTimelineFrame> => {
  const timeline = commandCreators.reduce(
    (
      acc: SubstepTimelineAcc,
      commandCreator: CurriedCommandCreator,
      index: number
    ) => {
      // error short-circuit
      if (acc.errors) return acc

      const nextFrame = commandCreator(invariantContext, acc.prevRobotState)

      if (nextFrame.errors) {
        return { ...acc, errors: nextFrame.errors }
      }

      // NOTE: only aspirate and dispense commands will appear alone in atomic commands
      // from compound command creators (e.g. transfer, distribute, etc.)
      const firstCommand = nextFrame.commands[0]
      const nextRobotState = getNextRobotStateAndWarningsMulti(
        nextFrame.commands,
        invariantContext,
        acc.prevRobotState
      ).robotState

      if (
        firstCommand.command === 'aspirate' ||
        firstCommand.command === 'dispense'
      ) {
        assert(
          nextFrame.commands.length === 1,
          `substepTimeline expected nextFrame to have only single commands for ${firstCommand.command}`
        )

        const commandGroup = firstCommand
        const { well, volume, labware } = commandGroup.params
        const wellInfo = {
          labware,
          wells: [well],
          preIngreds: acc.prevRobotState.liquidState.labware[labware][well],
          postIngreds: nextRobotState.liquidState.labware[labware][well],
        }
        const ingredKey =
          commandGroup.command === 'aspirate' ? 'source' : 'dest'
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              volume,
              [ingredKey]: wellInfo,
              activeTips: acc.prevActiveTips,
            },
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return {
          ...acc,
          prevActiveTips:
            _getNewActiveTips(nextFrame.commands) || acc.prevActiveTips,
          prevRobotState: nextRobotState,
        }
      }
    },
    {
      timeline: [],
      errors: null,
      prevActiveTips: null,
      prevRobotState: initialRobotState,
    }
  )

  return timeline.timeline
}

// timeline for multi-channel substep context
const substepTimelineMulti = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
): Array<SubstepTimelineFrame> => {
  const timeline = commandCreators.reduce(
    (
      acc: SubstepTimelineAcc,
      commandCreator: CurriedCommandCreator,
      index: number
    ) => {
      // error short-circuit
      if (acc.errors) return acc

      const nextFrame = commandCreator(invariantContext, acc.prevRobotState)

      if (nextFrame.errors) {
        return { ...acc, errors: nextFrame.errors }
      }

      const nextRobotState = getNextRobotStateAndWarningsMulti(
        nextFrame.commands,
        invariantContext,
        acc.prevRobotState
      ).robotState

      const firstCommand = nextFrame.commands[0]
      if (
        firstCommand.command === 'aspirate' ||
        firstCommand.command === 'dispense'
      ) {
        assert(
          nextFrame.commands.length === 1,
          `substepTimeline expected nextFrame to have only single commands for ${firstCommand.command}`
        )

        const { well, volume, labware } = firstCommand.params
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

        const ingredKey =
          firstCommand.command === 'aspirate' ? 'source' : 'dest'
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              volume,
              [ingredKey]: wellInfo,
              activeTips: acc.prevActiveTips,
            },
          ],
          prevRobotState: nextRobotState,
        }
      } else {
        return {
          ...acc,
          prevActiveTips: _getNewActiveTips(nextFrame.commands),
          prevRobotState: nextRobotState,
        }
      }
    },
    {
      timeline: [],
      errors: null,
      prevActiveTips: null,
      prevRobotState: initialRobotState,
    }
  )

  return timeline.timeline
}

const substepTimeline = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
) => {
  if (channels === 1) {
    return substepTimelineSingle(
      commandCreators,
      invariantContext,
      initialRobotState
    )
  } else {
    return substepTimelineMulti(
      commandCreators,
      invariantContext,
      initialRobotState,
      channels
    )
  }
}

export default substepTimeline
