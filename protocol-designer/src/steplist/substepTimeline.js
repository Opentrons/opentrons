// @flow
import assert from 'assert'
import last from 'lodash/last'
import pick from 'lodash/pick'
import type {Channels} from '@opentrons/components'
import type {
  CommandCreator,
  CommandCreatorError,
  CommandsAndRobotState,
  RobotState,
} from '../step-generation/types'

import {getWellsForTips} from '../step-generation/utils'
import type {SubstepTimelineFrame, TipLocation} from './types'

function _conditionallyUpdateActiveTips (acc: SubstepTimelineAcc, nextFrame: CommandsAndRobotState) {
  const lastNewTipCommand = last(nextFrame.commands.filter(c => c.command === 'pick-up-tip'))
  const newTipParams = lastNewTipCommand &&
    lastNewTipCommand.command === 'pick-up-tip' &&
    lastNewTipCommand.params

  if (newTipParams) {
    return {...acc, prevActiveTips: {...newTipParams}}
  }
  return acc
}

type SubstepTimelineAcc = {
  timeline: Array<SubstepTimelineFrame>,
  errors: ?Array<CommandCreatorError>,
  prevActiveTips: ?TipLocation,
  prevRobotState: RobotState,
}

const substepTimelineSingle = (commandCreators: Array<CommandCreator>) =>
  (initialRobotState: RobotState): Array<SubstepTimelineFrame> => {
    const timeline = commandCreators.reduce((acc: SubstepTimelineAcc, commandCreator: CommandCreator, index: number) => {
      // error short-circuit
      if (acc.errors) return acc

      const nextFrame = commandCreator(acc.prevRobotState)

      if (nextFrame.errors) {
        return {...acc, errors: nextFrame.errors}
      }

      // NOTE: only aspirate and dispense commands will appear alone in atomic commands
      // from compound command creators (e.g. transfer, distribute, etc.)
      const firstCommand = nextFrame.commands[0]
      if (
        firstCommand.command === 'aspirate' ||
        firstCommand.command === 'dispense') {
        assert(nextFrame.commands.length === 1,
          `substepTimeline expected nextFrame to have only single commands for ${firstCommand.command}`)

        const commandGroup = firstCommand
        const {well, volume, labware} = commandGroup.params
        const wellInfo = {
          labware,
          wells: [well],
          preIngreds: acc.prevRobotState.liquidState.labware[labware][well],
          postIngreds: nextFrame.robotState.liquidState.labware[labware][well],
        }
        const ingredKey = commandGroup.command === 'aspirate' ? 'source' : 'dest'
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
          prevRobotState: nextFrame.robotState,
        }
      } else {
        return {
          ..._conditionallyUpdateActiveTips(acc, nextFrame),
          prevRobotState: nextFrame.robotState,
        }
      }
    }, {timeline: [], errors: null, prevActiveTips: null, prevRobotState: initialRobotState})

    return timeline.timeline
  }

type SubstepContext = {channels?: Channels, getLabwareType?: (labwareId: string) => ?string}
const substepTimeline = (
  commandCreators: Array<CommandCreator>,
  context?: SubstepContext = {channels: 1}
) => {
  if (context.channels === 1) {
    return substepTimelineSingle(commandCreators)
  } else {
    // timeline for multi-channel substep context
    return (
      (initialRobotState: RobotState): Array<SubstepTimelineFrame> => {
        const timeline = commandCreators.reduce((acc: SubstepTimelineAcc, commandCreator: CommandCreator, index: number) => {
          // error short-circuit
          if (acc.errors) return acc

          const nextFrame = commandCreator(acc.prevRobotState)

          if (nextFrame.errors) {
            return {...acc, errors: nextFrame.errors}
          }

          const firstCommand = nextFrame.commands[0]
          if (
            firstCommand.command === 'aspirate' ||
            firstCommand.command === 'dispense'
          ) {
            assert(nextFrame.commands.length === 1,
              `substepTimeline expected nextFrame to have only single commands for ${firstCommand.command}`)

            const {well, volume, labware} = firstCommand.params
            const labwareType = context.getLabwareType && context.getLabwareType(labware)
            const wellsForTips = context.channels && labwareType && getWellsForTips(context.channels, labwareType, well).wellsForTips
            const wellInfo = {
              labware,
              wells: wellsForTips || [],
              preIngreds: wellsForTips ? pick(acc.prevRobotState.liquidState.labware[labware], wellsForTips) : {},
              postIngreds: wellsForTips ? pick(nextFrame.robotState.liquidState.labware[labware], wellsForTips) : {},
            }

            const ingredKey = firstCommand.command === 'aspirate' ? 'source' : 'dest'
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
              prevRobotState: nextFrame.robotState,
            }
          } else {
            return {
              ..._conditionallyUpdateActiveTips(acc, nextFrame),
              prevRobotState: nextFrame.robotState,
            }
          }
        }, {timeline: [], errors: null, prevActiveTips: null, prevRobotState: initialRobotState})

        return timeline.timeline
      }
    )
  }
}

export default substepTimeline
