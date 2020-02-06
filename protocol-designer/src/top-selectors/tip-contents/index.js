// @flow
import { createSelector } from 'reselect'
import noop from 'lodash/noop'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import { getWellSetForMultichannel } from '../../utils'
import * as StepGeneration from '../../step-generation'
import { allSubsteps as getAllSubsteps } from '../substeps'
import { START_TERMINAL_ITEM_ID, END_TERMINAL_ITEM_ID } from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as stepsSelectors } from '../../ui/steps'
import { selectors as fileDataSelectors } from '../../file-data'
import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { OutputSelector } from 'reselect'
import type { BaseState, Selector } from '../../types'

type GetTipCallback = (
  wellName: string
) => ?{ empty: boolean, highlighted: boolean }

type GetTipSelector = OutputSelector<
  BaseState,
  { labwareId: string },
  GetTipCallback
>

function getLabwareIdProp(state, props: { labwareId: string }) {
  return props.labwareId
}

function getTipHighlighted(
  labwareId: string,
  labwareDef: LabwareDefinition2,
  wellName: string,
  commandsAndRobotState: StepGeneration.CommandsAndRobotState,
  invariantContext: StepGeneration.InvariantContext
): boolean {
  const { commands } = commandsAndRobotState
  const commandUsesTip = (c: Command) => {
    if (c.command === 'pickUpTip' && c.params.labware === labwareId) {
      const commandWellName = c.params.well
      const pipetteId = c.params.pipette
      const pipetteSpec =
        invariantContext.pipetteEntities[pipetteId]?.spec || {}

      if (pipetteSpec.channels === 1) {
        return commandWellName === wellName
      } else if (pipetteSpec.channels === 8) {
        const wellSet = getWellSetForMultichannel(labwareDef, commandWellName)
        return Boolean(wellSet && wellSet.includes(wellName))
      } else {
        console.error(
          `Unexpected number of channels: ${pipetteSpec.channels ||
            '?'}. Could not get tip highlight state`
        )
        return false
      }
    }
    return false
  }

  return commands.some(commandUsesTip)
}

function getTipEmpty(
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
  (initialRobotState, labwareId) => (wellName: string) => ({
    empty: getTipEmpty(wellName, labwareId, initialRobotState),
    highlighted: false,
  })
)

const getLastValidTips: GetTipSelector = createSelector(
  fileDataSelectors.lastValidRobotState,
  getLabwareIdProp,
  (lastValidRobotState, labwareId) => (wellName: string) => ({
    empty: getTipEmpty(wellName, labwareId, lastValidRobotState),
    highlighted: false,
  })
)

export const getMissingTipsByLabwareId: Selector<{
  [labwareId: string]: WellGroup,
}> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  fileDataSelectors.getRobotStateTimeline,
  stepsSelectors.getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.lastValidRobotState,
  (
    orderedStepIds,
    robotStateTimeline,
    activeItem,
    initialRobotState,
    lastValidRobotState
  ) => {
    let robotState = null

    if (!activeItem.isStep) {
      const terminalId = activeItem.id
      if (terminalId === START_TERMINAL_ITEM_ID) {
        robotState = initialRobotState
      } else if (terminalId === END_TERMINAL_ITEM_ID) {
        robotState = lastValidRobotState
      } else {
        console.error(
          `Invalid terminalId ${terminalId}, could not getMissingTipsByLabwareId`
        )
      }
    } else {
      const stepId = activeItem.id
      const timeline = robotStateTimeline.timeline
      const timelineIdx = orderedStepIds.includes(stepId)
        ? orderedStepIds.findIndex(id => id === stepId)
        : null

      if (timelineIdx == null) {
        console.error(`Expected non-null timelineIdx for step ${stepId}`)
        return {}
      }

      const prevFrame = timeline[timelineIdx - 1]
      if (prevFrame) robotState = prevFrame.robotState
    }

    const missingTips =
      robotState &&
      robotState.tipState &&
      // $FlowFixMe(bc, 2019-05-31): flow choking on mapValues
      mapValues(robotState.tipState.tipracks, tipMap =>
        reduce(
          tipMap,
          (acc, hasTip, wellName): WellGroup =>
            hasTip ? acc : { ...acc, [wellName]: null },
          {}
        )
      )
    return missingTips || {}
  }
)

export const getTipsForCurrentStep: GetTipSelector = createSelector(
  stepFormSelectors.getOrderedStepIds,
  stepFormSelectors.getInvariantContext,
  fileDataSelectors.getRobotStateTimeline,
  stepsSelectors.getHoveredStepId,
  stepsSelectors.getActiveItem,
  getInitialTips,
  getLastValidTips,
  getLabwareIdProp,
  stepsSelectors.getHoveredSubstep,
  getAllSubsteps,
  (
    orderedStepIds,
    invariantContext,
    robotStateTimeline,
    hoveredStepId,
    activeItem,
    initialTips,
    lastValidTips,
    labwareId,
    hoveredSubstepIdentifier,
    allSubsteps
  ) => {
    const labwareDef = invariantContext.labwareEntities[labwareId].def
    if (!activeItem.isStep) {
      const terminalId = activeItem.id
      if (terminalId === START_TERMINAL_ITEM_ID) {
        return initialTips
      } else if (terminalId === END_TERMINAL_ITEM_ID) {
        return lastValidTips
      } else {
        console.error(
          `Invalid terminalId ${terminalId}, could not getTipsForCurrentStep`
        )
        return noop
      }
    }

    const stepId = activeItem.id
    const timeline = robotStateTimeline.timeline
    const timelineIdx = orderedStepIds.includes(stepId)
      ? orderedStepIds.findIndex(id => id === stepId)
      : null

    if (timelineIdx == null) {
      console.error(`Expected non-null timelineIdx for step ${stepId}`)
      return noop
    }

    const prevFrame = timeline[timelineIdx - 1]

    const hovered = stepId === hoveredStepId
    const currentFrame = timeline[timelineIdx]
    return (wellName: string) => {
      // show empty/present tip state at end of previous frame
      const empty = prevFrame
        ? getTipEmpty(wellName, labwareId, prevFrame.robotState)
        : false

      // show highlights of tips used by current frame, if user is hovering
      let highlighted = false
      if (hoveredSubstepIdentifier && currentFrame) {
        const { substepIndex } = hoveredSubstepIdentifier
        const substepsForStep = allSubsteps[hoveredSubstepIdentifier.stepId]

        if (substepsForStep && substepsForStep.substepType === 'sourceDest') {
          if (substepsForStep.multichannel) {
            const hoveredSubstepData =
              substepsForStep.multiRows[substepIndex][0] // just use first multi row

            let wellSet: ?Array<string> = []
            const hoveredTipWell = hoveredSubstepData.activeTips?.well
            if (hoveredTipWell != null) {
              wellSet = getWellSetForMultichannel(labwareDef, hoveredTipWell)
            }

            highlighted =
              (hoveredSubstepData &&
                hoveredSubstepData.activeTips &&
                hoveredSubstepData.activeTips.labware === labwareId &&
                Boolean(wellSet && wellSet.includes(wellName))) ||
              false
          } else {
            // single-channel
            const hoveredSubstepData = substepsForStep.rows[substepIndex]

            highlighted =
              (hoveredSubstepData &&
                hoveredSubstepData.activeTips &&
                hoveredSubstepData.activeTips.labware === labwareId &&
                hoveredSubstepData.activeTips.well === wellName) ||
              false
          }
        }
      } else if (hovered && currentFrame) {
        highlighted = getTipHighlighted(
          labwareId,
          labwareDef,
          wellName,
          currentFrame,
          invariantContext
        )
      }

      return {
        empty,
        highlighted,
      }
    }
  }
)
