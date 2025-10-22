import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import round from 'lodash/round'

import { COLORS } from '@opentrons/components'
import {
  _wellContentsForLabware,
  AIR,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import type { WellGroup } from '@opentrons/components'
import type {
  LabwareDefinition2,
  Liquid,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  ContentsByWell,
  DeckSlot,
  InvariantContext,
  LocationLiquidState,
  PipetteTemporalProperties,
  RobotState,
  SingleLabwareLiquidState,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'

type WellContentsByLabware = Record<string, ContentsByWell>

const VOLUME_SIG_DIGITS_DEFAULT = 2
export function formatVolume(
  inputVolume?: string | number | null,
  sigDigits: number = VOLUME_SIG_DIGITS_DEFAULT
): string {
  if (typeof inputVolume === 'number') {
    const digits = inputVolume.toString().includes('.') ? sigDigits : 0
    return String(round(inputVolume, digits))
  }
  return inputVolume || ''
}

const PERCENTAGE_DECIMALS_ALLOWED = 1
export const formatPercentage = (part: number, total: number): string =>
  `${round((part / total) * 100, PERCENTAGE_DECIMALS_ALLOWED)}%`

export const getAllWellContentsAtFrame = (
  liquidState: RobotState['liquidState'],
  labwareDef: LabwareDefinition2
): WellContentsByLabware => {
  const labwareLiquidState = liquidState.labware
  const wellContentsByLabwareId = mapValues(
    labwareLiquidState,
    (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => {
      return _wellContentsForLabware(labwareLiquids, labwareDef)
    }
  )
  return wellContentsByLabwareId
}

const getSlotFromPipetteLocation = (
  entityUnderPipette: string,
  labware: RobotState['labware'],
  trashBinEntities: TrashBinEntities,
  wasteChuteEntities: WasteChuteEntities
): string | null => {
  if (labware[entityUnderPipette] != null) {
    return getSlotInLocationStack(labware[entityUnderPipette].stack)
  } else if (trashBinEntities[entityUnderPipette] != null) {
    return trashBinEntities[entityUnderPipette].location.split('cutout')[1]
  } else if (wasteChuteEntities[entityUnderPipette] != null) {
    return wasteChuteEntities[entityUnderPipette].location.split('cutout')[1]
  } else
    console.warn(
      `expected to find slot assosciated with piette location ${entityUnderPipette} but could not`
    )
  return null
}

export const getActiveSlotForLabwareDetails = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  currentCommand: RunTimeCommand
): DeckSlot | null => {
  const { labware, pipettes } = robotState
  const { trashBinEntities, wasteChuteEntities, labwareEntities } =
    invariantContext
  const entityUnderPipette = Object.values(pipettes).find(
    pipette => pipette.entityId != null
  )?.entityId
  let slot = null

  if (entityUnderPipette != null) {
    slot = getSlotFromPipetteLocation(
      entityUnderPipette,
      labware,
      trashBinEntities,
      wasteChuteEntities
    )
  } else if ('labwareId' in currentCommand.params) {
    const isTiprack =
      labwareEntities[currentCommand.params.labwareId].def.parameters.isTiprack
    if (!isTiprack) {
      slot = currentCommand.params.labwareId
    }
  }

  return slot
}

export const getActiveSlotForTiprackDetails = (
  pipettes: PipetteTemporalProperties[],
  robotState: RobotState,
  invariantContext: InvariantContext
): DeckSlot | null => {
  const { labware } = robotState
  const { trashBinEntities, wasteChuteEntities } = invariantContext
  const tiprackUnderPipette = pipettes.find(
    pipette => pipette.tiprackId != null
  )?.tiprackId
  let slot = null

  if (tiprackUnderPipette != null) {
    slot = getSlotFromPipetteLocation(
      tiprackUnderPipette,
      labware,
      trashBinEntities,
      wasteChuteEntities
    )
  }

  return slot
}

export const getMissingTips = (
  tipState: RobotState['tipState'],
  labwareId: string
): WellGroup | null => {
  const missingTipsByLabwareId =
    tipState &&
    mapValues(tipState.tipracks, tipMap =>
      reduce(
        tipMap,
        (acc, hasTip, wellName): WellGroup =>
          hasTip ? acc : { ...acc, [wellName]: null },
        {}
      )
    )
  const missingTips = missingTipsByLabwareId
    ? missingTipsByLabwareId[labwareId]
    : null

  return missingTips
}

interface TipSvgInfo {
  tipColor: string
  tipCurrentVolume: number
}

export const getTipSvgInfo = (
  pipetteLocationLiquidState: LocationLiquidState,
  liquids: Liquid[]
): TipSvgInfo => {
  const ingredIds = Object.keys(pipetteLocationLiquidState)
  const colorsInTip = liquids.reduce<string[]>(
    (acc, { id, displayColor }) =>
      ingredIds.includes(id) && displayColor ? [...acc, displayColor] : acc,
    []
  )
  const tipColor =
    colorsInTip.length > 1 ? COLORS.grey40 : (colorsInTip[0] ?? COLORS.grey40)
  const tipCurrentVolume = Object.values(pipetteLocationLiquidState).reduce(
    (sum, { volume }) => sum + volume,
    0
  )
  return { tipColor, tipCurrentVolume }
}

export const getWellVolume = (
  labwareLocationLiquidState: LocationLiquidState
): number =>
  Object.entries(labwareLocationLiquidState).reduce(
    (sum, [id, volume]) => (id !== AIR ? sum + volume.volume : sum),
    0
  )

export const getIsPipetteActive = (
  side: 'left' | 'right',
  pipettes: RobotState['pipettes'],
  currentCommand: RunTimeCommand
): boolean => {
  const pipetteId =
    Object.entries(pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === side
    )?.[0] ?? null
  return (
    'pipetteId' in currentCommand.params &&
    currentCommand.params.pipetteId === pipetteId &&
    pipetteId != null &&
    pipettes[pipetteId].entityId != null
  )
}
