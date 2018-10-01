// @flow
import pick from 'lodash/pick'
import type {CommandCreator, RobotState, Timeline} from '../step-generation/types'

import {getWellsForTips} from '../step-generation/utils'
import type StepItemSourceDestRow from './types'

const substepTimelineSingle = (commandCreators: Array<CommandCreator>) =>
  (initialRobotState: RobotState): Array<StepItemSourceDestRow> => {
    let prevRobotState = initialRobotState
    const timeline = commandCreators.reduce((acc: Timeline, commandCreator: CommandCreator, index: number) => {
      // error short-circuit
      if (acc.errors) return acc

      const nextFrame = commandCreator(prevRobotState)

      if (nextFrame.errors) {
        return {timeline: acc.timeline, errors: nextFrame.errors}
      }

      if (nextFrame.commands.length === 1) {
        const {command, params} = nextFrame.commands[0]
        const {well, volume, labware} = params
        let nextSubstepFrame = {volume}
        const wellInfo = {
          labware,
          well,
          preIngreds: prevRobotState.liquidState.labware[labware][well],
          postIngreds: nextFrame.robotState.liquidState.labware[labware][well],
        }
        if (command === 'aspirate') {
          nextSubstepFrame = {...nextSubstepFrame, source: wellInfo}
        } else if (command === 'dispense') {
          nextSubstepFrame = {...nextSubstepFrame, dest: wellInfo}
        }
        prevRobotState = nextFrame.robotState
        return {timeline: [...acc.timeline, nextSubstepFrame], errors: null}
      } else {
        return acc
      }
    }, {timeline: [], errors: null})

    return timeline.timeline
  }

type SubstepContext = {channels?: number, getLabwareType?: (labwareId: string) => ?string}
const substepTimeline = (
  commandCreators: Array<CommandCreators>,
  context: ?SubstepContext = {channels: 1}
) => {
  if (context.channels === 1) {
    return substepTimelineSingle(commandCreators)
  } else {
    return (
      (initialRobotState: RobotState): Array<StepItemSourceDestRow> => {
        let prevRobotState = initialRobotState
        const timeline = commandCreators.reduce((acc: Timeline, commandCreator: CommandCreator, index: number) => {
          // error short-circuit
          if (acc.errors) return acc

          const nextFrame = commandCreator(prevRobotState)

          if (nextFrame.errors) {
            return {timeline: acc.timeline, errors: nextFrame.errors}
          }

          if (nextFrame.commands.length === 1) {
            const {command, params} = nextFrame.commands[0]
            const {well, volume, labware} = params
            const labwareType = context.getLabwareType(labware)
            const wellsForTips = getWellsForTips(context.channels, labwareType, well).wellsForTips
            let nextSubstepFrame = {volume}
            const wellInfo = {
              labware,
              wells: wellsForTips,
              preIngreds: pick(prevRobotState.liquidState.labware[labware], wellsForTips),
              postIngreds: pick(nextFrame.robotState.liquidState.labware[labware], wellsForTips),
            }
            if (command === 'aspirate') {
              nextSubstepFrame = {...nextSubstepFrame, source: wellInfo}
            } else if (command === 'dispense') {
              nextSubstepFrame = {...nextSubstepFrame, dest: wellInfo}
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
