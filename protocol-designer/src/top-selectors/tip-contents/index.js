// @flow
import {createSelector} from 'reselect'
import noop from 'lodash/noop'
import * as StepGeneration from '../../step-generation'
import {allSubsteps as getAllSubsteps} from '../substeps'
import {
  selectors as steplistSelectors,
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
} from '../../steplist'
import {selectors as fileDataSelectors} from '../../file-data'
import {getWellSetForMultichannel} from '../../well-selection/utils'

import type {OutputSelector} from 'reselect'
import type {BaseState} from '../../types'
import type {ElementProps} from 'react'
import {typeof Labware} from '@opentrons/components'

type GetTipProps = $PropertyType<ElementProps<Labware>, 'getTipProps'>
type GetTipSelector = OutputSelector<BaseState, {labwareId: string}, GetTipProps>

function getLabwareIdProp (state, props: {labwareId: string}) {
  return props.labwareId
}

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
      const labwareType = StepGeneration.getLabwareType(labwareId, robotState)
      const channels = StepGeneration.getPipetteChannels(pipetteId, robotState)

      if (!labwareType) {
        console.error(`Labware ${labwareId} missing labwareType. Could not get tip highlight state`)
        return false
      } else if (channels === 1) {
        return commandWellName === wellName
      } else if (channels === 8) {
        const wellSet = getWellSetForMultichannel(labwareType, commandWellName)
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

const getInitialTips: GetTipSelector = createSelector(
  fileDataSelectors.getInitialRobotState,
  getLabwareIdProp,
  (initialRobotState, labwareId) =>
    (wellName: string) => ({
      empty: getTipEmpty(wellName, labwareId, initialRobotState),
      highlighted: false,
    })
)

const getLastValidTips: GetTipSelector = createSelector(
  fileDataSelectors.lastValidRobotState,
  getLabwareIdProp,
  (lastValidRobotState, labwareId) =>
    (wellName: string) => ({
      empty: getTipEmpty(wellName, labwareId, lastValidRobotState),
      highlighted: false,
    })
)

export const getTipsForCurrentStep: GetTipSelector = createSelector(
  steplistSelectors.getOrderedSteps,
  fileDataSelectors.getRobotStateTimeline,
  steplistSelectors.getHoveredStepId,
  steplistSelectors.getActiveItem,
  getInitialTips,
  getLastValidTips,
  getLabwareIdProp,
  steplistSelectors.getHoveredSubstep,
  getAllSubsteps,
  (orderedSteps, robotStateTimeline, hoveredStepId, activeItem, initialTips, lastValidTips, labwareId, hoveredSubstepIdentifier, allSubsteps) => {
    if (!activeItem.isStep) {
      const terminalId = activeItem.id
      if (terminalId === START_TERMINAL_ITEM_ID) {
        return initialTips
      } else if (terminalId === END_TERMINAL_ITEM_ID) {
        return lastValidTips
      } else {
        console.error(`Invalid terminalId ${terminalId}, could not getTipsForCurrentStep`)
        return noop
      }
    }

    const stepId = activeItem.id
    const hovered = stepId === hoveredStepId
    const timeline = robotStateTimeline.timeline
    const timelineIdx = orderedSteps.includes(stepId)
      ? orderedSteps.findIndex(id => id === stepId)
      : null

    if (timelineIdx == null) {
      console.error(`Expected non-null timelineIdx for step ${stepId}`)
      return noop
    }

    const prevFrame = timeline[timelineIdx - 1]
    const currentFrame = timeline[timelineIdx]

    return (wellName: string) => {
      // show empty/present tip state at end of previous frame
      const empty = (prevFrame)
        ? getTipEmpty(wellName, labwareId, prevFrame.robotState)
        : false

      // show highlights of tips used by current frame, if user is hovering
      let highlighted = false
      if (hoveredSubstepIdentifier && currentFrame) {
        const {substepIndex} = hoveredSubstepIdentifier
        const substepsForStep = allSubsteps[hoveredSubstepIdentifier.stepId]

        if (substepsForStep && substepsForStep.stepType !== 'pause') {
          if (substepsForStep.multichannel) {
            const hoveredSubstepData = substepsForStep.multiRows[substepIndex][0] // just use first multi row

            const labwareType = StepGeneration.getLabwareType(labwareId, currentFrame.robotState)
            const wellSet = (labwareType && hoveredSubstepData.activeTips)
              ? getWellSetForMultichannel(labwareType, hoveredSubstepData.activeTips.well)
              : []

            highlighted = (hoveredSubstepData &&
              hoveredSubstepData.activeTips &&
              hoveredSubstepData.activeTips.labware === labwareId &&
              Boolean(wellSet && wellSet.includes(wellName))
            ) || false
          } else {
            // single-channel
            const hoveredSubstepData = substepsForStep.rows[substepIndex]

            highlighted = (hoveredSubstepData &&
              hoveredSubstepData.activeTips &&
              hoveredSubstepData.activeTips.labware === labwareId &&
              hoveredSubstepData.activeTips.well === wellName
            ) || false
          }
        }
      } else if (hovered && currentFrame) {
        highlighted = getTipHighlighted(labwareId, wellName, currentFrame)
      }

      return {
        empty,
        highlighted,
      }
    }
  }
)
