// @flow
import pick from 'lodash/pick'
import type {Channels} from '@opentrons/components'
import type {CommandCreator, RobotState, CommandCreatorError} from '../step-generation/types'

import {getWellsForTips} from '../step-generation/utils'
import type {SubstepTimelineFrame} from './types'

type SubstepTimeline = {
  timeline: Array<SubstepTimelineFrame>,
  errors: ?Array<CommandCreatorError>,
}
const substepTimelineSingle = (commandCreators: Array<CommandCreator>) =>
  (initialRobotState: RobotState): Array<SubstepTimelineFrame> => {
    let prevRobotState = initialRobotState
    const timeline = commandCreators.reduce((acc: SubstepTimeline, commandCreator: CommandCreator, index: number) => {
      // error short-circuit
      if (acc.errors) return acc

      const nextFrame = commandCreator(prevRobotState)

      if (nextFrame.errors) {
        return {timeline: acc.timeline, errors: nextFrame.errors}
      }

      // NOTE: only aspirate and dispense commands will appear alone in atomic commands
      // from compound command creators (e.g. transfer, distribute, etc.)
      if (nextFrame.commands.length === 1) {
        const commandGroup = nextFrame.commands[0]
        let nextSubstepFrame = {}
        if (commandGroup.command === 'aspirate' || commandGroup.command === 'dispense') {
          const {well, volume, labware} = commandGroup.params
          const wellInfo = {
            labware,
            wells: [well],
            preIngreds: prevRobotState.liquidState.labware[labware][well],
            postIngreds: nextFrame.robotState.liquidState.labware[labware][well],
          }
          const ingredKey = commandGroup.command === 'aspirate' ? 'source' : 'dest'
          nextSubstepFrame = {volume, [ingredKey]: wellInfo}
        }
        prevRobotState = nextFrame.robotState
        return {timeline: [...acc.timeline, nextSubstepFrame], errors: null}
      } else {
        return acc
      }
    }, {timeline: [], errors: null})

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
    return (
      (initialRobotState: RobotState): Array<SubstepTimelineFrame> => {
        let prevRobotState = initialRobotState
        const timeline = commandCreators.reduce((acc: SubstepTimeline, commandCreator: CommandCreator, index: number) => {
          // error short-circuit
          if (acc.errors) return acc

          const nextFrame = commandCreator(prevRobotState)

          if (nextFrame.errors) {
            return {timeline: acc.timeline, errors: nextFrame.errors}
          }

          if (nextFrame.commands.length === 1) {
            const commandGroup = nextFrame.commands[0]
            let nextSubstepFrame = {}

            if (commandGroup.command === 'aspirate' || commandGroup.command === 'dispense') {
              const {well, volume, labware} = commandGroup.params
              const labwareType = context.getLabwareType && context.getLabwareType(labware)
              const wellsForTips = context.channels && labwareType && getWellsForTips(context.channels, labwareType, well).wellsForTips
              const wellInfo = {
                labware,
                wells: wellsForTips || [],
                preIngreds: wellsForTips ? pick(prevRobotState.liquidState.labware[labware], wellsForTips) : {},
                postIngreds: wellsForTips ? pick(nextFrame.robotState.liquidState.labware[labware], wellsForTips) : {},
              }
              const ingredKey = commandGroup.command === 'aspirate' ? 'source' : 'dest'
              nextSubstepFrame = {volume, [ingredKey]: wellInfo}
            }
            prevRobotState = nextFrame.robotState
            return {timeline: [...acc.timeline, nextSubstepFrame], errors: null}
          } else {
            return acc
          }
        }, {timeline: [], errors: null})

        return timeline.timeline
      }
    )
  }
}

export default substepTimeline
