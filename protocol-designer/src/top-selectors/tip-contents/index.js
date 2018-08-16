// @flow
import {createSelector} from 'reselect'
import noop from 'lodash/noop'
import * as StepGeneration from '../../step-generation'
import {
  selectors as steplistSelectors,
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
  type TerminalItemId
} from '../../steplist'
import {selectors as fileDataSelectors} from '../../file-data'
import {getWellSetForMultichannel} from '../../well-selection/utils'

import type {Selector} from '../../types'
import type {ElementProps} from 'react'
import {typeof Labware} from '@opentrons/components'
type GetTipProps = $PropertyType<ElementProps<Labware>, 'getTipProps'>

function getTipHighlighted (
  labwareId: string,
  wellName: string,
  commandsAndRobotState: StepGeneration.CommandsAndRobotState
): boolean {
  const {commands, robotState} = commandsAndRobotState
  const commandUsesTip = (c: StepGeneration.Command) => {
    if (c.command === 'pick-up-tip' && c.params.labware === labwareId) {
      const commandWellName = c.params.well
      const pipetteId = c.params.pipette
      const labwareName = StepGeneration.getLabwareType(labwareId, robotState)
      const channels = StepGeneration.getPipetteChannels(pipetteId, robotState)

      if (!labwareName) {
        console.error(`Labware ${labwareId} missing labwareName. Could not get tip highlight state`)
        return false
      } else if (channels === 1) {
        return commandWellName === wellName
      } else if (channels === 8) {
        const wellSet = getWellSetForMultichannel(labwareName, commandWellName)
        return Boolean(wellSet && wellSet.includes(wellName))
      } else {
        console.error(`Unexpected number of channels: ${channels || '?'}. Could not get tip highlight state`)
        return false
      }
    }
    return false
  }

  return commands.some(commandUsesTip)
}

function getTipEmpty (
  wellName: string,
  labwareId: string,
  robotState: StepGeneration.RobotState
): boolean {
  return !(
    robotState.tipState.tipracks[labwareId] &&
    robotState.tipState.tipracks[labwareId][wellName]
  )
}

export const makeGetTerminalTips = (terminalId: TerminalItemId, labwareId: string) => {
  let robotStateSelector
  if (terminalId === START_TERMINAL_ITEM_ID) {
    robotStateSelector = fileDataSelectors.getInitialRobotState
  } else if (terminalId === END_TERMINAL_ITEM_ID) {
    robotStateSelector = fileDataSelectors.lastValidRobotState
  } else {
    console.error(`Invalid terminalId ${terminalId}, could not makeGetTerminalTips`)
    return noop
  }
  const getInitialTips: Selector<GetTipProps> = createSelector(
    robotStateSelector,
    (initialRobotState) => (wellName: string) => ({
      empty: getTipEmpty(wellName, labwareId, initialRobotState),
      highlighted: false
    })
  )
  return getInitialTips
}

type TipsPerStep = {[stepId: number]: GetTipProps}
export const makeGetTipsPerStep = (labwareId: string) => {
  const getTipsPerStep: Selector<TipsPerStep> = createSelector(
    steplistSelectors.orderedSteps,
    fileDataSelectors.robotStateTimeline,
    (orderedSteps, robotStateTimeline) => {
      const timeline = robotStateTimeline.timeline
      return orderedSteps.reduce((acc: TipsPerStep, stepId, timelineIdx) => {
        const prevFrame: ?* = timeline[timelineIdx - 1]
        const currentFrame: ?* = timeline[timelineIdx]

        return {
          ...acc,
          [stepId]: (wellName: string) => {
            // show empty/present tip state at end of previous frame
            const empty = (prevFrame)
              ? getTipEmpty(wellName, labwareId, prevFrame.robotState)
              : false

            // show highlights of tips used by current frame
            const highlighted = (currentFrame)
              ? getTipHighlighted(labwareId, wellName, currentFrame)
              : false

            return {
              empty,
              highlighted
            }
          }
        }
      }, {})
    }
  )
  return getTipsPerStep
}
