import mapValues from 'lodash/mapValues'
import { createSelector } from 'reselect'

import {
  A1_NOZZLE,
  ALL,
  COLUMN,
  getWellNamePerMultiTip,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'
import * as StepGeneration from '@opentrons/step-generation'

import { selectors as fileDataSelectors } from '../file-data'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  getHoveredStepId,
  getHoveredSubstep,
  getSelectedStepId,
} from '../ui/steps'
import { getWellSetForMultichannel } from '../utils'

import type { WellGroup } from '@opentrons/components'
import type {
  ActiveNozzleNumber,
  CreateCommand,
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { LabwareEntity, PipetteEntity } from '@opentrons/step-generation'
import type { SubstepItemData } from '../steplist/types'
import type { Selector } from '../types'

function _wellsForPipette(
  pipetteEntity: PipetteEntity,
  labwareEntity: LabwareEntity,
  wells: string[],
  nozzles: NozzleConfigurationStyle,
  primaryNozzle: PrimaryNozzleConfigurationStyle
): string[] {
  const pipChannels = pipetteEntity.spec.channels
  // `wells` is all the wells that pipette interacts with.
  if ((pipChannels === 8 || pipChannels === 96) && nozzles !== SINGLE) {
    let channels: ActiveNozzleNumber = pipChannels
    if ((nozzles === COLUMN && pipChannels === 96) || pipChannels === 8) {
      channels = 8
    }
    if (nozzles === ROW) {
      channels = 12
    }
    if (nozzles === PARTIAL_COLUMN && primaryNozzle) {
      channels = PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    }

    return wells.reduce((acc: string[], well: string) => {
      const setOfWellsForMulti = getWellNamePerMultiTip(
        labwareEntity.def,
        well,
        channels
      )
      return setOfWellsForMulti ? [...acc, ...setOfWellsForMulti] : acc // setOfWellsForMulti is null
    }, [])
  }

  // single-channel
  return wells
}

function _getSelectedWellsForStep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  frame: StepGeneration.CommandsAndRobotState,
  invariantContext: StepGeneration.InvariantContext
): string[] {
  if (StepGeneration.getHasNoWellsFromCCArgs(stepArgs)) {
    return []
  }

  const pipetteId = StepGeneration.getPipetteIdFromCCArgs(stepArgs)
  const pipetteEntity = pipetteId
    ? invariantContext.pipetteEntities[pipetteId]
    : null
  const labwareEntity = invariantContext.labwareEntities[labwareId]

  if (!pipetteEntity || !labwareEntity) {
    return []
  }
  const nozzles = 'nozzles' in stepArgs ? stepArgs.nozzles : ALL
  const primaryNozzle =
    'primaryNozzle' in stepArgs ? stepArgs.primaryNozzle : A1_NOZZLE

  const getWells = (wells: string[]): string[] =>
    _wellsForPipette(
      pipetteEntity,
      labwareEntity,
      wells,
      nozzles,
      primaryNozzle
    )

  const wells = []

  // If we're moving liquids within a single labware,
  // both the source and dest wells together need to be selected.
  if (stepArgs.commandCreatorFnName === 'mix') {
    if (stepArgs.labware === labwareId) {
      wells.push(...getWells(stepArgs.wells))
    }
  } else if (stepArgs.commandCreatorFnName === 'transfer') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells(stepArgs.sourceWells))
    }

    if (stepArgs.destLabware === labwareId && stepArgs.destWells != null) {
      wells.push(...getWells(stepArgs.destWells))
    }
  } else if (stepArgs.commandCreatorFnName === 'consolidate') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells(stepArgs.sourceWells))
    }

    if (stepArgs.destLabware === labwareId && stepArgs.destWell != null) {
      wells.push(...getWells([stepArgs.destWell]))
    }
  } else if (stepArgs.commandCreatorFnName === 'distribute') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells([stepArgs.sourceWell]))
    }

    if (stepArgs.destLabware === labwareId) {
      wells.push(...getWells(stepArgs.destWells))
    }
  }

  frame.commands.forEach((c: CreateCommand) => {
    if (c.commandType === 'pickUpTip' && c.params.labwareId === labwareId) {
      const pipetteId = c.params.pipetteId
      const pipetteSpec =
        invariantContext.pipetteEntities[pipetteId]?.spec || {}
      let channels: ActiveNozzleNumber = pipetteSpec.channels
      if ('nozzles' in stepArgs) {
        if (stepArgs.nozzles === COLUMN) {
          channels = 8
        } else if (stepArgs.nozzles === SINGLE) {
          channels = 1
        } else if (stepArgs.nozzles === ROW) {
          channels = 12
        } else if (stepArgs.nozzles === PARTIAL_COLUMN) {
          const partialNozzle = stepArgs.primaryNozzle as PartialPrimaryNozzles
          channels = PARTIAL_NOZZLE_MAP[partialNozzle]
        }
      }
      const commandWellName = c.params.wellName

      if (channels === 1) {
        wells.push(commandWellName)
      } else {
        const wellSet =
          getWellSetForMultichannel({
            labwareDef: invariantContext.labwareEntities[labwareId].def,
            wellName: commandWellName,
            channels,
          }) || []
        wells.push(...wellSet)
      }
    }
  })
  return wells
}

/** Scan through given substep rows to get a list of source/dest wells for the given labware */
function _getSelectedWellsForSubstep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  substeps: SubstepItemData | null | undefined,
  substepIndex: number,
  invariantContext: StepGeneration.InvariantContext
): string[] {
  if (substeps === null) {
    return []
  }

  // TODO: Ian 2018-10-01 proper type for wellField enum
  function getWells(wellField: 'source' | 'dest'): string[] {
    // ignore substeps with no well fields
    // TODO: Ian 2019-01-29 be more explicit about commandCreatorFnName,
    // don't rely so heavily on the fact that their well fields are the same now
    // @ts-expect-error(sa, 2021-6-22): type narrow
    if (!substeps || substeps.commandCreatorFnName === 'delay') return []
    // @ts-expect-error(sa, 2021-6-22): type narrow
    if (substeps.rows && substeps.rows[substepIndex]) {
      // single-channel
      // @ts-expect-error(sa, 2021-6-22): type narrow
      const wellData = substeps.rows[substepIndex][wellField]
      return wellData && wellData.well ? [wellData.well] : []
    }
    // @ts-expect-error(sa, 2021-6-22): type narrow
    if (substeps.multiRows && substeps.multiRows[substepIndex]) {
      // multi-channel
      // @ts-expect-error(sa, 2021-6-22): type narrow
      return substeps.multiRows[substepIndex].reduce((acc, multiRow) => {
        const wellData = multiRow[wellField]
        return wellData && wellData.well ? [...acc, wellData.well] : acc
      }, [])
    }

    return []
  }

  const wells: string[] = []

  // single-labware steps
  if (
    stepArgs.commandCreatorFnName === 'mix' &&
    stepArgs.labware &&
    stepArgs.labware === labwareId
  ) {
    return getWells('source')
  }

  // source + dest steps

  if (
    'sourceLabware' in stepArgs &&
    stepArgs.sourceLabware != null &&
    stepArgs.sourceLabware === labwareId
  ) {
    wells.push(...getWells('source'))
  }

  if (
    'destLabware' in stepArgs &&
    stepArgs.destLabware != null &&
    stepArgs.destLabware === labwareId
  ) {
    wells.push(...getWells('dest'))
  }

  if (substeps && substeps.substepType === 'sourceDest') {
    let tipWellSet: string[] = []
    if ('pipette' in stepArgs) {
      if (substeps.multichannel) {
        if ('nozzles' in stepArgs && stepArgs.nozzles !== SINGLE) {
          const { activeTips } = substeps.multiRows[substepIndex][0]
          const pipChannels =
            invariantContext.pipetteEntities[stepArgs.pipette].spec.channels
          let channels = pipChannels

          if (stepArgs.nozzles === COLUMN) {
            channels = 8
          }

          // just use first multi row
          if (
            activeTips &&
            activeTips.labwareId === labwareId &&
            channels !== 1
          ) {
            const multiTipWellSet = getWellSetForMultichannel({
              labwareDef: invariantContext.labwareEntities[labwareId].def,
              wellName: activeTips.wellName,
              channels,
            })
            if (multiTipWellSet) tipWellSet = multiTipWellSet
          }
        } else {
          // single-nozzle pick up
          const { activeTips } = substeps.multiRows[substepIndex][0]
          if (
            activeTips &&
            activeTips.labwareId === labwareId &&
            activeTips.wellName
          ) {
            tipWellSet = [activeTips.wellName]
          }
        }
      } else {
        // single-channel
        const { activeTips } = substeps.rows[substepIndex]
        if (
          activeTips &&
          activeTips.labwareId === labwareId &&
          activeTips.wellName
        ) {
          tipWellSet = [activeTips.wellName]
        }
      }
    }
    wells.push(...tipWellSet)
  }

  return wells
}

export const wellHighlightsByLabwareId: Selector<Record<string, WellGroup>> =
  createSelector(
    fileDataSelectors.getRobotStateTimeline,
    stepFormSelectors.getInvariantContext,
    stepFormSelectors.getArgsAndErrorsByStepId,
    getHoveredStepId,
    getHoveredSubstep,
    fileDataSelectors.getSubsteps,
    stepFormSelectors.getOrderedStepIds,
    getSelectedStepId,
    (
      robotStateTimeline,
      invariantContext,
      allStepArgsAndErrors,
      hoveredStepId,
      hoveredSubstep,
      substepsById,
      orderedStepIds,
      selectedStepId
    ) => {
      const timeline = robotStateTimeline.timeline
      const stepId = hoveredStepId || selectedStepId
      const timelineIndex = orderedStepIds.findIndex(i => i === stepId)
      const frame = timeline[timelineIndex]
      const robotState = frame && frame.robotState
      const stepArgs =
        stepId != null &&
        allStepArgsAndErrors[stepId] &&
        allStepArgsAndErrors[stepId].stepArgs

      if (!robotState || stepId == null || !stepArgs) {
        // nothing hovered, or no stepArgs for step
        return {}
      }

      // replace value of each labware with highlighted wells info
      return mapValues(
        robotState.liquidState.labware,
        (
          labwareLiquids: StepGeneration.SingleLabwareLiquidState,
          labwareId: string
        ) => {
          let selectedWells: string[] = []

          if (hoveredSubstep != null) {
            // wells for hovered substep
            selectedWells = _getSelectedWellsForSubstep(
              stepArgs,
              labwareId,
              substepsById[stepId],
              hoveredSubstep.substepIndex,
              invariantContext
            )
          } else {
            // wells for step overall
            selectedWells = _getSelectedWellsForStep(
              stepArgs,
              labwareId,
              frame,
              invariantContext
            )
          }

          // return selected wells eg {A1: null, B4: null}
          return selectedWells.reduce(
            (acc, well) => ({ ...acc, [well]: null }),
            {}
          )
        }
      )
    }
  )
