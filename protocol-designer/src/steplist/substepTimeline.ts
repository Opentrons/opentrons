import last from 'lodash/last'

import { ALL, COLUMN, SINGLE } from '@opentrons/shared-data'
import {
  getNextRobotStateAndWarningsSingleCommand,
  getWellsForTips,
} from '@opentrons/step-generation'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  CommandCreatorError,
  CommandsAndWarnings,
  CurriedCommandCreator,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'
import type { SourceDestData, SubstepTimelineFrame, TipLocation } from './types'

/** Return last picked up tip in the specified commands, if any */
export function _getNewActiveTips(
  commands: CreateCommand[]
): TipLocation | null | undefined {
  const lastNewTipCommand: CreateCommand | null | undefined = last(
    commands.filter(c => c.commandType === 'pickUpTip')
  )
  const newTipParams =
    (lastNewTipCommand != null &&
      lastNewTipCommand.commandType === 'pickUpTip' &&
      lastNewTipCommand.params) ||
    null
  return newTipParams
}

const _createNextTimelineFrame = (args: {
  command: CreateCommand
  index: number
  nextFrame: CommandsAndWarnings
  volume: number
  wellInfo: SourceDestData
}): SubstepTimelineFrame => {
  const { volume, wellInfo } = args

  const _newTimelineFrameKeys = {
    volume,
    activeTips: _getNewActiveTips(args.nextFrame.commands.slice(0, args.index)),
  }

  const newTimelineFrame =
    args.command.commandType === 'aspirateInPlace'
      ? {
          ..._newTimelineFrameKeys,
          source: wellInfo,
        }
      : {
          ..._newTimelineFrameKeys,
          dest: wellInfo,
        }
  return newTimelineFrame
}

interface SubstepTimelineAcc {
  timeline: SubstepTimelineFrame[]
  errors: CommandCreatorError[] | null | undefined
  prevRobotState: RobotState
}
export const substepTimelineSingleChannel = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): SubstepTimelineFrame[] => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)

  if ('commands' in nextFrame) {
    const timeline: SubstepTimelineAcc = nextFrame.commands.reduce<SubstepTimelineAcc>(
      (acc: SubstepTimelineAcc, command: CreateCommand, index: number) => {
        const nextRobotState = getNextRobotStateAndWarningsSingleCommand(
          command,
          invariantContext,
          acc.prevRobotState
        ).robotState

        const { labwareEntities, wasteChuteEntities } = invariantContext
        const { pipettes, liquidState } = acc.prevRobotState

        if (
          command.commandType === 'dispenseInPlace' ||
          command.commandType === 'aspirateInPlace'
        ) {
          if (
            'meta' in command &&
            command.meta != null &&
            'isAirGap' in command.meta
          ) {
            return {
              ...acc,
              timeline: acc.timeline,
              prevRobotState: nextRobotState,
            }
          }
          const { volume, pipetteId } = command.params
          const pipetteEntity = pipettes[pipetteId]
          const location = pipetteEntity.location ?? ''
          const wellName = pipetteEntity.wellName ?? ''
          const isMoveToWell = labwareEntities[location] != null

          if (isMoveToWell) {
            const { id: labwareId } = invariantContext.labwareEntities[location]

            const wellInfo = {
              labwareId,
              wells: [wellName],
              preIngreds:
                acc.prevRobotState.liquidState.labware[labwareId][wellName],
              postIngreds:
                nextRobotState.liquidState.labware[labwareId][wellName],
            }

            return {
              ...acc,
              prevRobotState: nextRobotState,
              timeline: [
                ...acc.timeline,
                _createNextTimelineFrame({
                  volume,
                  index,
                  nextFrame,
                  command,
                  wellInfo,
                }),
              ],
            }
          } else {
            const isWasteChute = wasteChuteEntities[location] != null
            const wellInfo = {
              additionalEquipmentId: location,
              wells: [],
              preIngreds: isWasteChute
                ? liquidState.wasteChute[location]
                : liquidState.trashBins[location],
              postIngreds: isWasteChute
                ? nextRobotState.liquidState.wasteChute[location]
                : nextRobotState.liquidState.trashBins[location],
            }

            return {
              ...acc,
              prevRobotState: nextRobotState,
              timeline: [
                ...acc.timeline,
                _createNextTimelineFrame({
                  volume,
                  index,
                  nextFrame,
                  command,
                  wellInfo,
                }),
              ],
            }
          }
        } else {
          return {
            timeline: acc.timeline,
            errors: null,
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
  } else {
    return []
  }
}
// timeline for multi-channel substep context
export const substepTimelineMultiChannel = (
  commandCreator: CurriedCommandCreator,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): SubstepTimelineFrame[] => {
  const nextFrame = commandCreator(invariantContext, initialRobotState)

  if ('commands' in nextFrame) {
    const timeline = nextFrame.commands.reduce<SubstepTimelineAcc>(
      (acc: SubstepTimelineAcc, command: CreateCommand, index: number) => {
        const nextRobotState = getNextRobotStateAndWarningsSingleCommand(
          command,
          invariantContext,
          acc.prevRobotState
        ).robotState

        const {
          labwareEntities,
          pipetteEntities,
          wasteChuteEntities,
        } = invariantContext
        const { pipettes, liquidState } = acc.prevRobotState

        if (
          command.commandType === 'dispenseInPlace' ||
          command.commandType === 'aspirateInPlace'
        ) {
          if (
            'meta' in command &&
            command.meta != null &&
            'isAirGap' in command.meta
          ) {
            return {
              errors: null,
              timeline: acc.timeline,
              prevRobotState: nextRobotState,
            }
          }

          const { volume, pipetteId } = command.params
          const pipetteEntity = pipettes[pipetteId]
          const location = pipetteEntity.location ?? ''
          const wellName = pipetteEntity.wellName ?? ''
          const isMoveToWell = labwareEntities[location] != null
          const channels = pipetteEntities[pipetteId].spec.channels
          const nozzles = pipetteEntity.nozzles

          let numChannels = channels
          if (nozzles === ALL && channels === 96) {
            numChannels = 96
          } else if (nozzles === COLUMN) {
            numChannels = 8
          } else if (nozzles === SINGLE) {
            numChannels = 1
          }
          if (isMoveToWell) {
            const {
              def: labwareDef,
              id: labwareId,
            } = invariantContext.labwareEntities[location]
            const wellsForTips =
              numChannels &&
              labwareDef &&
              getWellsForTips(numChannels, labwareDef, wellName).wellsForTips

            const newTimelineEntries: SubstepTimelineFrame[] = []
            for (const well of wellsForTips) {
              const wellInfo = {
                labwareId,
                wells: [well],
                preIngreds: liquidState.labware[labwareId][well],
                postIngreds:
                  nextRobotState.liquidState.labware[labwareId][well],
              }

              newTimelineEntries.push(
                _createNextTimelineFrame({
                  volume,
                  index,
                  nextFrame,
                  command,
                  wellInfo,
                })
              )
            }
            return {
              ...acc,
              timeline: [...acc.timeline, ...newTimelineEntries],
              prevRobotState: nextRobotState,
            }
          } else {
            const isWasteChute = wasteChuteEntities[location] != null
            const wellInfo = {
              additionalEquipmentId: location,
              wells: [],
              preIngreds: isWasteChute
                ? liquidState.wasteChute[location]
                : liquidState.trashBins[location],
              postIngreds: isWasteChute
                ? nextRobotState.liquidState.wasteChute[location]
                : nextRobotState.liquidState.trashBins[location],
            }

            return {
              ...acc,
              timeline: [
                ...acc.timeline,
                _createNextTimelineFrame({
                  volume,
                  index,
                  nextFrame,
                  command,
                  wellInfo,
                }),
              ],
              prevRobotState: nextRobotState,
            }
          }
        }
        return { ...acc, prevRobotState: nextRobotState }
      },
      {
        timeline: [],
        errors: null,
        prevRobotState: initialRobotState,
      }
    )
    return timeline.timeline
  } else {
    return []
  }
}
