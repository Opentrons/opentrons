import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import sum from 'lodash/sum'
import values from 'lodash/values'

import { COLORS, WellGroup } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  _wellContentsForLabware,
  getLiquidIdsOnLabware,
  getSlotInLocationStack,
  getVolumesPerLiquid,
} from '@opentrons/step-generation'

import type {
  AddressableAreaName,
  CoordinateTuple,
  CutoutId,
  LabwareDefinition2,
  Liquid,
  RobotType,
} from '@opentrons/shared-data'
import type {
  ContentsByWell,
  DeckSlot,
  ModuleEntities,
  RobotState,
  SingleLabwareLiquidState,
} from '@opentrons/step-generation'

interface HoverDimensions {
  width: number
  height: number
  x: number
  y: number
}
interface LiquidDetailInfo {
  totalVolume: number
  color: string
  displayName: string
}
type WellContentsByLabware = Record<string, ContentsByWell>

const FOURTH_COLUMN_SLOTS = ['A4', 'B4', 'C4', 'D4']

export const getFlexHoverDimensions = (
  stagingAreaLocations: string[],
  cutoutId: CutoutId,
  slotId: string,
  hasTCOnSlot: boolean,
  slotPosition: CoordinateTuple
): HoverDimensions => {
  const hasStagingArea = stagingAreaLocations.includes(cutoutId)

  const X_ADJUSTMENT_LEFT_SIDE = -101.5
  const X_ADJUSTMENT = -17
  const X_DIMENSION_MIDDLE_SLOTS = 160.3
  const X_DIMENSION_OUTER_SLOTS = hasStagingArea ? 160.0 : 246.5
  const X_DIMENSION_4TH_COLUMN_SLOTS = 175.0
  const Y_DIMENSION = hasTCOnSlot ? 294.0 : 106.0

  const slotFromCutout = slotId
  const isLeftSideofDeck =
    slotFromCutout === 'A1' ||
    slotFromCutout === 'B1' ||
    slotFromCutout === 'C1' ||
    slotFromCutout === 'D1'
  const xAdjustment = isLeftSideofDeck ? X_ADJUSTMENT_LEFT_SIDE : X_ADJUSTMENT
  const xSlotPosition = slotPosition[0] + xAdjustment

  const yAdjustment = -10
  const ySlotPosition = slotPosition[1] + yAdjustment

  const isMiddleOfDeck =
    slotId === 'A2' || slotId === 'B2' || slotId === 'C2' || slotId === 'D2'

  let xDimension = X_DIMENSION_OUTER_SLOTS
  if (isMiddleOfDeck) {
    xDimension = X_DIMENSION_MIDDLE_SLOTS
  } else if (FOURTH_COLUMN_SLOTS.includes(slotId)) {
    xDimension = X_DIMENSION_4TH_COLUMN_SLOTS
  }
  const x = xSlotPosition
  const y = ySlotPosition

  return { width: xDimension, height: Y_DIMENSION, x, y }
}

export const getStagingAreaAddressableAreas = (
  cutoutIds: CutoutId[],
  filterStandardSlots: boolean = true
): AddressableAreaName[] => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutFixtures = deckDef.cutoutFixtures

  const addressableAreasRaw = cutoutIds.flatMap(cutoutId => {
    const addressableAreasOnCutout = cutoutFixtures.find(
      cutoutFixture => cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
    )?.providesAddressableAreas[cutoutId]
    return addressableAreasOnCutout ?? []
  })
  if (filterStandardSlots) {
    return addressableAreasRaw.filter(
      aa => !isAddressableAreaStandardSlot(aa, deckDef)
    )
  }
  return addressableAreasRaw
}

export const getSlotIsEmpty = (
  robotState: RobotState,
  slot: string
): boolean => {
  const modulesInSlot = values(robotState.modules).filter(
    moduleTemporalProperties => {
      return slot.includes(moduleTemporalProperties.slot)
    }
  )

  const labwareInSlot = values(robotState.labware).filter(
    labwareTemporalProperties =>
      getSlotInLocationStack(labwareTemporalProperties.stack) === slot
  )

  return modulesInSlot.length === 0 && labwareInSlot.length === 0
}

export const getSlotIdsBlockedBySpanningForThermocycler = (
  modules: RobotState['modules'],
  moduleEntities: ModuleEntities,
  robotType: RobotType
): DeckSlot[] => {
  const loadedThermocycler = Object.keys(modules).find(
    id => moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )
  if (loadedThermocycler != null && robotType === FLEX_ROBOT_TYPE) {
    return ['A1', 'B1']
  } else if (loadedThermocycler != null && robotType === OT2_ROBOT_TYPE) {
    return ['7', '8', '10', '11']
  }

  return []
}

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

export const getLiquidDetailInfo = (
  wellContents: ContentsByWell,
  liquids: Liquid[]
): LiquidDetailInfo[] => {
  const individualIds = getLiquidIdsOnLabware(wellContents)
  const volumesPerLiquid = getVolumesPerLiquid(wellContents, individualIds)

  const liquidInfo: LiquidDetailInfo[] = individualIds.map(liquidId => {
    const totalVolume = sum(Object.values(volumesPerLiquid[parseInt(liquidId)]))
    const matchingLiquid = liquids.find(liquid => liquid.id === liquidId)

    return {
      totalVolume,
      //  TODO: add default liquid color
      color: matchingLiquid?.displayColor ?? '000000',
      displayName: matchingLiquid?.displayName ?? 'unknown display name',
    }
  })
  return liquidInfo
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

export const getBackgroundColor = (
  hoveredSlot: string | null,
  selectedSlot: string | null,
  slot: string,
  isSlotSelected: boolean
): string => {
  let backgroundColor = COLORS.grey50
  if (hoveredSlot === slot && isSlotSelected) {
    backgroundColor = COLORS.purple60
  } else if (hoveredSlot === slot && !isSlotSelected) {
    backgroundColor = COLORS.grey60
  } else if (selectedSlot === slot && isSlotSelected) {
    backgroundColor = COLORS.purple60
  } else if (selectedSlot === slot && !isSlotSelected) {
    backgroundColor = COLORS.grey60
  } else if (isSlotSelected) {
    backgroundColor = COLORS.purple40
  }
  return backgroundColor
}
