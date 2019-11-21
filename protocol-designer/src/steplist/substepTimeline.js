// @flow
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
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Array<SubstepTimelineFrame> => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  if (nextFrame.errors) return []
  console.log({ nextFrame })

  const timeline = nextFrame.commands.reduce(
    (acc: SubstepTimelineAcc, command: Command, index: number) => {
      console.log('inside substepTimelineSingle reduce', { acc, index })

      const nextRobotState = getNextRobotStateAndWarningsMulti(
        [command],
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
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
): Array<SubstepTimelineFrame> => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)
  if (nextFrame.errors) return []
  const timeline = nextFrame.commands.reduce(
    (acc: SubstepTimelineAcc, command: Command, index: number) => {
      const nextRobotState = getNextRobotStateAndWarningsMulti(
        nextFrame.commands,
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
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  channels: Channels
) => {
  if (channels === 1) {
    return substepTimelineSingle(
      commandCreator,
      invariantContext,
      initialRobotState
    )
  } else {
    return substepTimelineMulti(
      commandCreator,
      invariantContext,
      initialRobotState,
      channels
    )
  }
}

export default substepTimeline
