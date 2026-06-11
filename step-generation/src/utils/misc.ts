import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'

import {
  EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  FLEX_CUTOUT_BY_SLOT_ID,
  FLEX_ROBOT_TYPE,
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  FLEX_STACKER_ADDRESSABLE_AREAS,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_V1_FIXTURE,
  getDeckDefFromRobotType,
  getIsTiprack,
  getLabwareDefURI,
  getMaxPoolCount,
  getMmFromBottom,
  getWellNamePerMultiTip,
  linearInterpolate,
  NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  OT2_ROBOT_TYPE,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'

import {
  delay,
  dispense,
  moveToAddressableArea,
  moveToWell,
} from '../commandCreators/atomic'
import { blowOutInWell } from '../commandCreators/atomic/blowOutInWell'
import {
  airGapInTrash,
  airGapInWasteChute,
  airGapInWell,
  blowOutInTrash,
  blowOutInWasteChute,
  dispenseInTrash,
  dispenseInWasteChute,
} from '../commandCreators/compound'
import {
  CLEAN,
  COLUMN_4_SLOTS,
  EMPTY,
  FAKE_HOPPER_LOCATION_MAP,
  HOPPER_FAKE_LOCATIONS,
  HOPPER_STACKER_LOCATION,
  STAGING_AREA_SLOTS,
  VACUUM_DOCK_LOCATION,
  VACUUM_SPACER_LOAD_NAMES,
  ZERO_OFFSET,
} from '../constants'
import { curryCommandCreator } from './curryCommandCreator'
import { reduceCommandCreators, uuid } from './index'

import type {
  ActiveNozzleNumber,
  AddressableAreaName,
  BlowoutParams,
  CutoutFixtureId,
  CutoutId,
  LabwareDefinition2,
  LabwareLocationSequence,
  LoadLabwareRunTimeCommand,
  LoadLidParams,
  LoadLidStackRunTimeCommand,
  NozzleConfigurationStyle,
  PipetteChannels,
  PipetteV2Specs,
  PositionReference,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { HopperLocationMapKey } from '../constants'
import type {
  CommandCreator,
  CurriedCommandCreator,
  FlexStackerModuleState,
  InvariantContext,
  LabwareEntities,
  LabwareEntity,
  LabwareTemporalProperties,
  LocationLiquidState,
  ModuleEntities,
  PathOption,
  PipetteEntity,
  RobotState,
  SourceAndDest,
  StagingAreaEntities,
  TrashBinEntities,
  TrashBinEntity,
  WasteChuteEntities,
  WasteChuteEntity,
} from '../types'

export const AIR: '__air__' = '__air__'
export const SOURCE_WELL_BLOWOUT_DESTINATION: 'source_well' = 'source_well'
export const DEST_WELL_BLOWOUT_DESTINATION: 'dest_well' = 'dest_well'

export function getIsVacuumSpacer(def: LabwareDefinition2): boolean {
  return VACUUM_SPACER_LOAD_NAMES.includes(def.parameters.loadName)
}

type trashOrLabware = 'wasteChute' | 'trashBin' | 'labware' | null

export const getCutoutIdByAddressableArea = (
  addressableAreaName: AddressableAreaName,
  cutoutFixtureId: CutoutFixtureId,
  robotType: RobotType
): CutoutId => {
  const deckDef = getDeckDefFromRobotType(robotType)
  const cutoutFixtures = deckDef.cutoutFixtures
  const providesAddressableAreasForAddressableArea = cutoutFixtures.find(
    cutoutFixture => cutoutFixture.id.includes(cutoutFixtureId)
  )?.providesAddressableAreas

  const findCutoutIdByAddressableArea = (
    addressableAreaName: AddressableAreaName
  ): CutoutId | null => {
    if (providesAddressableAreasForAddressableArea != null) {
      for (const cutoutId in providesAddressableAreasForAddressableArea) {
        if (
          providesAddressableAreasForAddressableArea[
            cutoutId as keyof typeof providesAddressableAreasForAddressableArea
          ].includes(addressableAreaName)
        ) {
          return cutoutId as CutoutId
        }
      }
    }
    return null
  }

  const cutoutId = findCutoutIdByAddressableArea(addressableAreaName)

  if (cutoutId == null) {
    throw Error(
      `expected to find cutoutId from addressableAreaName ${addressableAreaName} but could not`
    )
  }
  return cutoutId
}

export function getWasteChuteAddressableAreaNamePip(
  channels: PipetteChannels
): AddressableAreaName {
  switch (channels) {
    case 1: {
      return ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    }
    case 8: {
      return EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    }
    case 96: {
      return NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    }
  }
}

export function getTrashBinAddressableAreaName(
  trashLocation: CutoutId
): AddressableAreaName {
  const deckDef = getDeckDefFromRobotType(
    trashLocation === ('cutout12' as CutoutId)
      ? OT2_ROBOT_TYPE
      : FLEX_ROBOT_TYPE
  )
  let cutouts: Record<CutoutId, AddressableAreaName[]> | null = null

  if (deckDef.robot.model === FLEX_ROBOT_TYPE) {
    cutouts =
      deckDef.cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === 'trashBinAdapter'
      )?.providesAddressableAreas ?? null
  }

  if (deckDef.robot.model === FLEX_ROBOT_TYPE && cutouts == null) {
    console.error(
      `expected to find a list of cutouts for the Flex but could not with trashLocation ${trashLocation}`
    )
  }
  //  assume trash location is the fixedTrash for OT-2 if cutouts is null
  return cutouts != null ? cutouts[trashLocation]?.[0] : 'fixedTrash'
}

export function getTrashLocationFromAddressableAreaName(
  addressableAreaName: AddressableAreaName
): CutoutId | null {
  if (addressableAreaName === 'fixedTrash') {
    return 'cutout12' as CutoutId
  }

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutouts =
    deckDef.cutoutFixtures.find(
      cutoutFixture => cutoutFixture.id === 'trashBinAdapter'
    )?.providesAddressableAreas ?? null

  if (cutouts == null) {
    console.error('Could not find trashBinAdapter cutouts for Flex')
    return null
  }

  for (const [cutoutId, areas] of Object.entries(cutouts)) {
    if (areas.includes(addressableAreaName)) {
      return cutoutId as CutoutId
    }
  }

  console.error(
    `Could not find trashLocation for addressableAreaName ${addressableAreaName}`
  )
  return null
}

export function getTrashOrLabware(
  labwareEntities: LabwareEntities,
  wasteChuteEntities: WasteChuteEntities,
  trashBinEntities: TrashBinEntities,
  destinationId: string
): trashOrLabware {
  if (labwareEntities[destinationId] != null) {
    return 'labware'
  } else if (wasteChuteEntities[destinationId] != null) {
    return 'wasteChute'
  } else if (trashBinEntities[destinationId] != null) {
    return 'trashBin'
  } else {
    console.error(
      `expected to determine if dest labware is a labware or waste chute with destLabware ${destinationId} but could not`
    )
    return null
  }
}

export function repeatArray<T>(array: T[], repeats: number): T[] {
  return flatMap(range(repeats), (i: number): T[] => array)
}
interface Vol {
  volume: number
}

/** Total volume of a location ("air" is not included in the sum) */
export function getLocationTotalVolume(loc: LocationLiquidState): number {
  return reduce(
    loc,
    (acc: number, ingredState: Vol, ingredId: string) => {
      return ingredId === AIR ? acc : acc + ingredState.volume
    },
    0
  )
}

/** Breaks a liquid volume state into 2 parts. Assumes all liquids are evenly mixed. */
export function splitLiquid(
  volume: number,
  sourceLiquidState: LocationLiquidState
): SourceAndDest {
  const totalSourceVolume = getLocationTotalVolume(sourceLiquidState)

  if (totalSourceVolume === 0) {
    // Splitting from empty source
    return {
      source: sourceLiquidState,
      dest: {
        [AIR]: {
          volume,
        },
      },
    }
  }

  if (volume > totalSourceVolume) {
    // Take all of source, plus air
    return {
      source: mapValues(sourceLiquidState, () => ({
        volume: 0,
      })),
      dest: {
        ...sourceLiquidState,
        [AIR]: {
          volume: volume - totalSourceVolume,
        },
      },
    }
  }

  const ratios: Record<string, number> = reduce(
    sourceLiquidState,
    (acc: Record<string, number>, ingredState: Vol, ingredId: string) => ({
      ...acc,
      [ingredId]: ingredState.volume / totalSourceVolume,
    }),
    {}
  )
  return Object.keys(sourceLiquidState).reduce(
    (acc, ingredId) => {
      const destVol = ratios[ingredId] * volume
      return {
        source: {
          ...acc.source,
          [ingredId]: {
            volume: sourceLiquidState[ingredId].volume - destVol,
          },
        },
        dest: {
          ...acc.dest,
          [ingredId]: {
            volume: destVol,
          },
        },
      }
    },
    {
      source: {},
      dest: {},
    }
  )
}

/** The converse of splitLiquid. Adds all of one liquid to the other.
 * The args are called 'source' and 'dest', but here they're interchangable.
 */
export function mergeLiquid(
  source: LocationLiquidState,
  dest: LocationLiquidState
): LocationLiquidState {
  return {
    // include all ingreds exclusive to 'dest'
    ...dest,
    ...reduce<LocationLiquidState, LocationLiquidState>(
      source,
      (acc, ingredState: Vol, ingredId: string) => {
        const isCommonIngred = ingredId in dest
        const ingredVolume = isCommonIngred // sum volumes of ingredients common to 'source' and 'dest'
          ? ingredState.volume + dest[ingredId].volume // include all ingreds exclusive to 'source'
          : ingredState.volume
        return {
          ...acc,
          [ingredId]: {
            volume: ingredVolume,
          },
        }
      },
      {}
    ),
  }
}

// TODO: Ian 2019-04-19 move to shared-data helpers?
export function getWellsForTips(
  channels: ActiveNozzleNumber,
  labwareDef: LabwareDefinition2,
  well: string
): {
  wellsForTips: string[]
  allWellsShared: boolean
} {
  // Array of wells corresponding to the tip at each position.
  const wellsForTips =
    channels === 1 ? [well] : getWellNamePerMultiTip(labwareDef, well, channels)

  if (!wellsForTips) {
    console.warn(
      channels === 1
        ? `Invalid well: ${well}`
        : `For labware def (URI ${getLabwareDefURI(
            labwareDef
          )}), with primary well ${well}, no wells are accessible by 8-channel's 1st tip`
    )
    // TODO: Ian 2019-04-11 figure out a clearer way to handle failure case
    return {
      wellsForTips: [],
      allWellsShared: false,
    }
  }

  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.
  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])
  return {
    wellsForTips,
    allWellsShared,
  }
}
// Set blowout location depending on the 'blowoutLocation' arg: set it to
// the SOURCE_WELL_BLOWOUT_DESTINATION / DEST_WELL_BLOWOUT_DESTINATION
// special strings, or to a labware ID.
export const mixBlowoutLocationHelper = (args: {
  pipette: BlowoutParams['pipetteId']
  sourceLabwareId: string
  sourceWell: BlowoutParams['wellName']
  destLabwareId: string
  blowoutLocation: string | null | undefined
  flowRate: number
  offsetFromTopMm: number
  invariantContext: InvariantContext
  destWell: BlowoutParams['wellName'] | null
}): CurriedCommandCreator[] => {
  const {
    pipette,
    sourceLabwareId,
    sourceWell,
    destLabwareId,
    destWell,
    blowoutLocation,
    flowRate,
    offsetFromTopMm,
    invariantContext,
  } = args
  if (!blowoutLocation) {
    return []
  }
  const { trashBinEntities, wasteChuteEntities } = invariantContext

  let labwareId: string | null = null
  let well: string | null = null
  if (blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labwareId = sourceLabwareId
    well = sourceWell
  } else if (blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION) {
    labwareId = destLabwareId
    well = destWell
  }
  if (well != null && labwareId != null) {
    return [
      curryCommandCreator(blowOutInWell, {
        pipetteId: pipette,
        labwareId: labwareId,
        wellName: well,
        flowRate,
        wellLocation: {
          origin: 'top',
          offset: {
            z: offsetFromTopMm,
          },
        },
      }),
    ]
  } else if (wasteChuteEntities[blowoutLocation] != null) {
    return [
      curryCommandCreator(blowOutInWasteChute, {
        pipetteId: pipette,
        flowRate,
        wasteChuteId: Object.keys(wasteChuteEntities)[0] as string,
      }),
    ]
  } else {
    return [
      curryCommandCreator(blowOutInTrash, {
        pipetteId: pipette,
        trashId: Object.keys(trashBinEntities)[0] as string,
        flowRate,
      }),
    ]
  }
}
export function createEmptyLiquidState(
  invariantContext: InvariantContext
): RobotState['liquidState'] {
  const {
    labwareEntities,
    pipetteEntities,
    wasteChuteEntities,
    trashBinEntities,
  } = invariantContext
  return {
    pipettes: reduce(
      pipetteEntities,
      (acc, pipette: PipetteEntity, id: string) => {
        const pipetteSpec = pipette.spec
        return { ...acc, [id]: createTipLiquidState(pipetteSpec.channels, {}) }
      },
      {}
    ),
    labware: reduce(
      labwareEntities,
      (acc, labware: LabwareEntity, id: string) => {
        return { ...acc, [id]: mapValues(labware.def.wells, () => ({})) }
      },
      {}
    ),
    trashBins: reduce(
      trashBinEntities,
      (acc, trashBin: TrashBinEntity, id: string) => {
        return { ...acc, [id]: {} }
      },
      {}
    ),
    wasteChute: reduce(
      wasteChuteEntities,
      (acc, wasteChute: WasteChuteEntity, id: string) => {
        return { ...acc, [id]: {} }
      },
      {}
    ),
  }
}
export function createTipLiquidState<T>(
  channels: number,
  contents: T
): Record<string, T> {
  return range(channels).reduce(
    (tipIdAcc, tipId) => ({ ...tipIdAcc, [tipId]: contents }),
    {}
  )
}
// always return destination unless the blowout location is the source
export const getDispenseAirGapLocation = (args: {
  destLabware: string
  destWell: string
  sourceWell?: string
  sourceLabware?: string
  blowoutLocation?: string | null
}): {
  dispenseAirGapLabware: string
  dispenseAirGapWell: string
} => {
  const { blowoutLocation, sourceLabware, destLabware, sourceWell, destWell } =
    args
  return blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION &&
    //  note: sourceLabware & sourceWell != null for air gap in a transfer only
    //  since transfer allows you to specify the blowout location as source well
    sourceLabware != null &&
    sourceWell != null
    ? {
        dispenseAirGapLabware: sourceLabware,
        dispenseAirGapWell: sourceWell,
      }
    : {
        //  this case is for transfer and consolidate when blowout location is NOT
        //  in a source well
        dispenseAirGapLabware: destLabware,
        dispenseAirGapWell: destWell,
      }
}
// NOTE: pipettes have no tips, tiprack are full
export function makeInitialRobotState(args: {
  invariantContext: InvariantContext
  labwareLocations: RobotState['labware']
  moduleLocations: RobotState['modules']
  pipetteLocations: RobotState['pipettes']
}): RobotState {
  const {
    invariantContext,
    labwareLocations,
    moduleLocations = {},
    pipetteLocations,
  } = args
  return {
    labware: labwareLocations,
    modules: moduleLocations,
    pipettes: pipetteLocations,
    liquidState: createEmptyLiquidState(invariantContext),
    tipState: {
      pipettes: reduce(
        pipetteLocations,
        (acc, pipetteTemporalProperties, id) =>
          pipetteTemporalProperties.mount
            ? { ...acc, [id]: { hasTip: false, tiprackURI: null } }
            : acc,
        {}
      ),
      tipracks: reduce(
        labwareLocations,
        (acc, _, labwareId) => {
          const def = invariantContext.labwareEntities[labwareId].def
          if (!getIsTiprack(def)) return acc
          const tipState = mapValues(def.wells, () => CLEAN)
          return { ...acc, [labwareId]: tipState }
        },
        {}
      ),
    },
  }
}

export const getTiprackHasTips = (
  tipState: RobotState['tipState'],
  labwareId: string
): boolean => {
  return tipState.tipracks[labwareId] != null
    ? Object.values(tipState.tipracks[labwareId]).some(
        tipState => tipState !== EMPTY
      )
    : false
}

export const getLabwareHasLiquid = (
  liquidState: RobotState['liquidState'],
  labwareId: string
): boolean => {
  return liquidState.labware[labwareId] != null
    ? Object.values(liquidState.labware[labwareId]).some(liquidState =>
        Object.values(liquidState).some(volume => volume.volume > 0)
      )
    : false
}

interface DispenseLocationHelperArgs {
  //  destinationId is either labware or addressableAreaName for waste chute
  destinationId: string
  pipetteId: string
  volume: number
  flowRate: number
  xOffset: number
  yOffset: number
  tipRack: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzles: NozzleConfigurationStyle
  offsetFromBottomMm?: number
  well?: string
}
export const dispenseLocationHelper: CommandCreator<
  DispenseLocationHelperArgs
> = (args, invariantContext, prevRobotState) => {
  const {
    destinationId,
    pipetteId,
    volume,
    flowRate,
    offsetFromBottomMm,
    well,
    xOffset,
    yOffset,
    tipRack,
    primaryNozzle,
    nozzles,
  } = args
  const { labwareEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const trashOrLabware = getTrashOrLabware(
    labwareEntities,
    wasteChuteEntities,
    trashBinEntities,
    destinationId
  )

  let commands: CurriedCommandCreator[] = []
  if (
    trashOrLabware === 'labware' &&
    offsetFromBottomMm != null &&
    well != null
  ) {
    commands = [
      curryCommandCreator(dispense, {
        pipetteId,
        volume,
        labwareId: destinationId,
        wellName: well,
        flowRate,
        wellLocation: {
          origin: 'bottom',
          offset: {
            z: offsetFromBottomMm,
            x: xOffset,
            y: yOffset,
          },
        },
        tipRack,
        primaryNozzle,
        nozzles,
      }),
    ]
  } else if (trashOrLabware === 'wasteChute') {
    commands = [
      curryCommandCreator(dispenseInWasteChute, {
        pipetteId,
        volume,
        flowRate,
        wasteChuteId: wasteChuteEntities[destinationId].id,
      }),
    ]
  } else {
    commands = [
      curryCommandCreator(dispenseInTrash, {
        pipetteId,
        volume,
        flowRate,
        trashId: trashBinEntities[destinationId].id,
      }),
    ]
  }

  return reduceCommandCreators(commands, invariantContext, prevRobotState)
}

interface MoveHelperArgs {
  //  destinationId is either labware or addressableAreaName for waste chute
  destinationId: string
  pipetteId: string
  zOffset: number
  primaryNozzle: PrimaryNozzleConfigurationStyle
  well?: string
}
export const moveHelper: CommandCreator<MoveHelperArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { destinationId, pipetteId, zOffset, well } = args
  const { labwareEntities, wasteChuteEntities, trashBinEntities } =
    invariantContext
  const trashOrLabware = getTrashOrLabware(
    labwareEntities,
    wasteChuteEntities,
    trashBinEntities,
    destinationId
  )

  let commands: CurriedCommandCreator[] = []
  if (trashOrLabware === 'labware' && well != null) {
    commands = [
      curryCommandCreator(moveToWell, {
        pipetteId: pipetteId,
        labwareId: destinationId,
        wellName: well,
        wellLocation: {
          origin: 'bottom',
          offset: { x: 0, y: 0, z: zOffset },
        },
      }),
    ]
  } else if (trashOrLabware === 'wasteChute') {
    commands = [
      curryCommandCreator(moveToAddressableArea, {
        pipetteId,
        fixtureId: wasteChuteEntities[destinationId].id,
        offset: { x: 0, y: 0, z: 0 },
      }),
    ]
  } else {
    commands = [
      curryCommandCreator(moveToAddressableArea, {
        pipetteId,
        fixtureId: trashBinEntities[destinationId].id,
        offset: ZERO_OFFSET,
      }),
    ]
  }

  return reduceCommandCreators(commands, invariantContext, prevRobotState)
}

interface AirGapLocationArgs {
  //  destinationId is either labware or addressableAreaName for waste chute
  destinationId: string
  destWell: string | null
  flowRate: number
  pipetteId: string
  volume: number
  blowOutLocation?: string | null
  sourceId?: string
  sourceWell?: string
}
export const airGapLocationHelper: CommandCreator<AirGapLocationArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    blowOutLocation,
    destinationId,
    destWell,
    flowRate,
    pipetteId,
    sourceId,
    sourceWell,
    volume,
  } = args
  const { labwareEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const trashOrLabware = getTrashOrLabware(
    labwareEntities,
    wasteChuteEntities,
    trashBinEntities,
    destinationId
  )

  let commands: CurriedCommandCreator[] = []
  if (trashOrLabware === 'labware' && destWell != null) {
    const { dispenseAirGapLabware, dispenseAirGapWell } =
      getDispenseAirGapLocation({
        blowoutLocation: blowOutLocation,
        sourceLabware: sourceId,
        destLabware: destinationId,
        sourceWell,
        destWell: destWell,
      })
    commands = [
      curryCommandCreator(airGapInWell, {
        flowRate,
        pipetteId,
        labwareId: dispenseAirGapLabware,
        wellName: dispenseAirGapWell,
        volume,
        type: 'dispense',
      }),
    ]
  } else if (trashOrLabware === 'wasteChute') {
    commands = [
      curryCommandCreator(airGapInWasteChute, {
        pipetteId,
        volume,
        flowRate,
        wasteChuteId: wasteChuteEntities[destinationId].id,
      }),
    ]
  } else {
    commands = [
      curryCommandCreator(airGapInTrash, {
        pipetteId,
        volume,
        flowRate,
        trashId: trashBinEntities[destinationId].id,
      }),
    ]
  }

  return reduceCommandCreators(commands, invariantContext, prevRobotState)
}

interface DelayLocationHelperArgs {
  pipetteId: string
  destinationId: string
  well: string | null
  zOffset: number
  seconds: number
}

export const delayLocationHelper: CommandCreator<DelayLocationHelperArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, destinationId, well, zOffset, seconds } = args
  const { labwareEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const trashOrLabware = getTrashOrLabware(
    labwareEntities,
    wasteChuteEntities,
    trashBinEntities,
    destinationId
  )

  let commands: CurriedCommandCreator[] = []

  if (well != null && trashOrLabware === 'labware') {
    commands = [
      curryCommandCreator(moveToWell, {
        pipetteId: pipetteId,
        labwareId: destinationId,
        wellName: well,
        wellLocation: {
          origin: 'bottom',
          offset: { x: 0, y: 0, z: zOffset },
        },
      }),
      curryCommandCreator(delay, {
        seconds: seconds,
      }),
    ]
  } else if (trashOrLabware === 'wasteChute') {
    commands = [
      curryCommandCreator(moveToAddressableArea, {
        pipetteId,
        fixtureId: destinationId,
        offset: ZERO_OFFSET,
      }),
      curryCommandCreator(delay, {
        seconds: seconds,
      }),
    ]
  } else {
    commands = [
      curryCommandCreator(moveToAddressableArea, {
        pipetteId,
        fixtureId: destinationId,
        offset: ZERO_OFFSET,
      }),
      curryCommandCreator(delay, {
        seconds: seconds,
      }),
    ]
  }

  return reduceCommandCreators(commands, invariantContext, prevRobotState)
}

export const getSlotInLocationStack = (
  stack: string[] | null,
  isStacker: boolean = false
): string => {
  if (stack == null) {
    console.error('expected to find stack but could not')
    return 'unknown slot'
  } else {
    const slot = stack[stack.length - 1]
    if (isStacker) {
      return `STACKER ${slot.slice(-2, -1)}`
    } else {
      return slot
    }
  }
}

export const getTopLocationInStack = (stack?: string[]): string => {
  if (stack == null) {
    console.error('expected to find stack but could not')
    return 'unknown top location'
  } else {
    return stack[0]
  }
}

export const getNearestParentInStack = (stack: string[]): string | null =>
  stack.length >= 2 ? stack[1] : null

export const getLargestStackInSlot = (
  labwareState: RobotState['labware'],
  slot: string
): string[] =>
  Object.values(labwareState).reduce<string[]>((acc, { stack }) => {
    if (stack[stack.length - 1] === slot && stack.length > acc.length) {
      acc = stack
    }
    return acc
  }, [])

/** Single-slot deck id (e.g. A3) for a staging-area slot (e.g. A4) on Flex. */
export const getFlexStackerCutoutBaseDeckSlotId = (
  column4StagingSlotId: (typeof COLUMN_4_SLOTS)[number]
): string =>
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID[FLEX_CUTOUT_BY_SLOT_ID[column4StagingSlotId]]

export const column4StagingSlotIdFromFlexStackerShuttleAddressableArea = (
  addressableAreaName: AddressableAreaName
): (typeof COLUMN_4_SLOTS)[number] | null => {
  const index = FLEX_STACKER_ADDRESSABLE_AREAS.indexOf(addressableAreaName)
  return index === -1 ? null : COLUMN_4_SLOTS[index]
}

/** Deck slot id used as the stack suffix for labware on the stacker shuttle. */
export const deckSlotKeyForFlexStackerShuttleAddressableArea = (
  addressableAreaName: AddressableAreaName
): string | null => {
  const stagingSlotId =
    column4StagingSlotIdFromFlexStackerShuttleAddressableArea(
      addressableAreaName
    )
  return stagingSlotId != null
    ? getFlexStackerCutoutBaseDeckSlotId(stagingSlotId)
    : null
}

/**
 * Staging column ids (A4, B4, …) are the same physical cutout as the stacker's
 * module slot (A3, B3, …). Labware on the shuttle uses the module slot in
 * `labware.stack`; normalize here so stack-height checks match.
 */
export const resolveDeckSlotKeyForLabwareStackInSlot = (
  deckSlotKey: string | null,
  modules: RobotState['modules'],
  moduleEntities: ModuleEntities
): string | null => {
  if (deckSlotKey == null) {
    return null
  }
  if (COLUMN_4_SLOTS.includes(deckSlotKey)) {
    const baseSlot = getFlexStackerCutoutBaseDeckSlotId(
      deckSlotKey as (typeof COLUMN_4_SLOTS)[number]
    )
    const hasStackerOnCutout = Object.entries(modules).some(
      ([moduleId, mod]) =>
        moduleEntities[moduleId]?.type === FLEX_STACKER_MODULE_TYPE &&
        mod.slot === baseSlot
    )
    return hasStackerOnCutout ? baseSlot : deckSlotKey
  }
  return deckSlotKey
}

export const getFlexStackerShuttleAddressableArea = (
  moduleSlot: string
): AddressableAreaName | null => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const transformedSlot = `${moduleSlot[0]}3`
  const cutoutId = FLEX_CUTOUT_BY_SLOT_ID[transformedSlot]
  const flexStackerAAs = deckDef.cutoutFixtures.find(
    ({ id }) => id === FLEX_STACKER_V1_FIXTURE
  )?.providesAddressableAreas[cutoutId]

  return (
    FLEX_STACKER_ADDRESSABLE_AREAS.find(aa => flexStackerAAs?.includes(aa)) ??
    null
  )
}

interface CompatibleWithStack {
  isCompatible: boolean
  isAboveStackLimit: boolean
}

export const getIsLabwareCompatibleWithStack = (
  labwareId: string,
  //  stack is the full stack on the slot, including the slotName, modules, adapters
  stack: string[],
  labwareEntities: LabwareEntities,
  moduleEntities: ModuleEntities
): CompatibleWithStack => {
  // if stack is empty, moving directly to empty slot
  if (stack.length === 0) {
    return { isCompatible: true, isAboveStackLimit: false }
  }
  // Determine if labware is on hopper
  let isOnHopper = false
  const moduleId = stack.find(id => id in moduleEntities)
  if (moduleId != null) {
    const isStackerInStack =
      moduleEntities[moduleId].type === FLEX_STACKER_MODULE_TYPE
    isOnHopper = isStackerInStack && stack.includes(HOPPER_STACKER_LOCATION)
  }

  const topIdInStack = getTopLocationInStack(stack)
  let isCompatible: boolean = true
  let isAboveStackLimit: boolean = false

  // check compatibility with labware
  if (topIdInStack in labwareEntities) {
    const movingLabwareEntity = labwareEntities[labwareId]
    const topLabwareEntity = labwareEntities[topIdInStack]
    const labwareIdsInStack = stack.filter(id => labwareEntities[id] != null)
    const lidInStack = labwareIdsInStack.filter(id =>
      labwareEntities[id]?.def?.allowedRoles?.includes('lid')
    )[0]
    const adapterInStack = labwareIdsInStack.filter(id =>
      labwareEntities[id]?.def?.allowedRoles?.includes('adapter')
    )[0]
    const loadNameToCheck = topLabwareEntity.def.parameters.loadName
    const primaryLabwareInStack = labwareIdsInStack.filter(
      id =>
        !labwareEntities[id]?.def?.allowedRoles?.includes('adapter') &&
        !labwareEntities[id]?.def?.allowedRoles?.includes('lid')
    )[0]
    if (isOnHopper) {
      // allow labware without a stack limit to be stacked on the stacker
      const maxPoolCount = getMaxPoolCount({
        labwareDefinitions: {
          primary: labwareEntities[primaryLabwareInStack]?.def ?? null,
          adapter: labwareEntities[adapterInStack]?.def ?? null,
          lid: labwareEntities[lidInStack]?.def ?? null,
        },
        model: FLEX_STACKER_MODULE_V1,
      })
      isAboveStackLimit = stack.length > maxPoolCount
    } else {
      const topLabwareEntityStackLimit = topLabwareEntity.def.stackLimit ?? 1
      const isSameLoadName =
        loadNameToCheck === movingLabwareEntity.def.parameters.loadName
      const currentStackAmount = stack.filter(
        item =>
          labwareEntities[item]?.def.parameters.loadName === loadNameToCheck
      )?.length
      isAboveStackLimit =
        isSameLoadName && currentStackAmount >= topLabwareEntityStackLimit
    }

    // This is an exception to allow universal lids to be placed on any labware except
    // tube racks, aluminum blocks, tip racks, or other lids.
    const isUniversalLid =
      movingLabwareEntity.def.parameters.loadName ===
      'opentrons_tough_universal_lid'
    const isLabwareOnSlotTuberack =
      topLabwareEntity.def.metadata.displayCategory === 'tubeRack'
    const isLabwareOnSlotAluminumBlock =
      topLabwareEntity.def.metadata.displayCategory === 'aluminumBlock'
    const isLabwareOnSlotTiprack = topLabwareEntity.def.parameters.isTiprack
    const allowedRoles = topLabwareEntity.def.allowedRoles ?? []
    const isLidRole = allowedRoles.includes('lid')

    const isVacuumSpacer = getIsVacuumSpacer(topLabwareEntity.def)
    const movingLabwareIsCollar =
      movingLabwareEntity.def.parameters.quirks?.includes('vacuumModuleDock') ??
      false

    isCompatible =
      // filter plates can go on any non-lid, non-tiprack, non-filter-plate labware
      ((movingLabwareEntity.def.parameters.quirks?.includes('filterPlate') ??
        false) &&
        !isLidRole &&
        !isLabwareOnSlotTiprack &&
        !(
          topLabwareEntity.def.parameters.quirks?.includes('filterPlate') ??
          false
        )) ||
      // vacuum spacer: same rules as the main module area — only collars and filter plates
      (isVacuumSpacer && movingLabwareIsCollar) ||
      // any labware can go onto an adapter that provides a stacking default (spacers excluded above)
      ((topLabwareEntity.def.parameters.quirks?.includes(
        'providesStackingDefault'
      ) ??
        false) &&
        !isVacuumSpacer) ||
      // check compatible labware key
      movingLabwareEntity.def.compatibleParentLabware?.some(
        loadName => loadName === loadNameToCheck
      ) ||
      // check stacking offset map for legacy compatibility
      Object.keys(movingLabwareEntity.def.stackingOffsetWithLabware ?? {}).some(
        lw => lw === loadNameToCheck
      ) ||
      (isUniversalLid &&
        !isLabwareOnSlotTuberack &&
        !isLabwareOnSlotAluminumBlock &&
        !isLabwareOnSlotTiprack &&
        (topLabwareEntity.def.parameters.loadName ===
          'opentrons_tough_universal_lid' ||
          !isLidRole))

    // check compatibility with module
  } else if (topIdInStack in moduleEntities) {
    const topModuleEntity = moduleEntities[topIdInStack]
    const { model: stackingModel } = topModuleEntity
    isCompatible =
      // check compatible labware key
      Object.keys(
        labwareEntities[labwareId].def.stackingOffsetWithModule ?? {}
      ).some(model => stackingModel === model)
  }
  return { isCompatible, isAboveStackLimit }
}

export const getModuleIdFromRobotStateStack = (
  modules: RobotState['modules'],
  stack?: string[]
): string | null => {
  return stack?.find(id => modules[id] != null) ?? null
}

const _getMappedLocation = (
  slot: string,
  isOnVacuumDock: boolean,
  isOnHopper: boolean
): string => {
  if (isOnVacuumDock) {
    return slot
  }
  if (isOnHopper) {
    return FAKE_HOPPER_LOCATION_MAP[slot as HopperLocationMapKey]
  }
  return slot
}

/**
 * Get the full stack in a slot given labware state
 * If the slot is offDeck, the offDeckOverrideId must be provided to override the offDeck slot,
 * since different offDeck stacks specify the same base "slot" being offDeck
 * @param labware - The labware object containing all labware entities
 * @param slot - The slot to get the full stack from
 * @param offDeckOverrideId - Labware ID for an offDeck stack
 * @returns The top full stack from the labware object
 */
export const getFullStackFromLabwares = (
  labware: {
    [labwareId: string]: LabwareTemporalProperties
  },
  slot: string,
  offDeckOverrideId?: string
): string[] => {
  if (slot === 'offDeck' && offDeckOverrideId == null) {
    console.error(
      'offDeck slot is not allowed to be used without an offDeckOverrideId'
    )
    return []
  }
  const isOnVacuumDock = getIsSlotAVacuumDock(slot)
  const isOnHopper = getIsSlotAHopper(slot)
  const mappedLocation = _getMappedLocation(slot, isOnVacuumDock, isOnHopper)
  const labwareStack = Object.values(labware).filter(
    lw =>
      lw.stack.includes(mappedLocation) &&
      (offDeckOverrideId == null || lw.stack.includes(offDeckOverrideId)) &&
      lw.stack.includes(HOPPER_STACKER_LOCATION) === isOnHopper &&
      lw.stack.includes(VACUUM_DOCK_LOCATION) === isOnVacuumDock
  )
  if (labwareStack.length === 0) {
    return []
  }

  if (isOnHopper) {
    return labwareStack.at(-1)?.stack ?? []
  }
  if (isOnVacuumDock) {
    return labwareStack.at(-1)?.stack ?? []
  }
  return (
    labwareStack.toSorted((a, b) => b.stack.length - a.stack.length)[0]
      ?.stack ?? []
  )
}

export const getTopmostLabwareOnModuleFromStackRobotState = (
  moduleId: string,
  labware: {
    [labwareId: string]: LabwareTemporalProperties
  }
): string => {
  return Object.values(labware)
    .filter(lw => lw.stack.includes(moduleId)) // all stacks involving this module
    .sort((a, b) => b.stack.length - a.stack.length)[0]?.stack[0] // return topmost labware from largest stack
}

const _getTotalVolumeForMultiDispense = (
  targetVol: number,
  conditioningByVolume: Array<[number, number]>,
  disposalByVolume: Array<[number, number]>,
  includeConditioning: boolean = true
): number => {
  const interpolatedConditioningVolume =
    linearInterpolate(targetVol, conditioningByVolume) ?? 0
  const interpolatedDisposalVolume =
    linearInterpolate(targetVol, disposalByVolume) ?? 0
  return (
    targetVol +
    (includeConditioning ? interpolatedConditioningVolume : 0) +
    interpolatedDisposalVolume
  )
}

export interface ReferenceVolumes {
  pushOut: number
  airGap: ValueByLiquidHandlingType
  correction: ValueByLiquidHandlingType
  flowRate: ValueByLiquidHandlingType
  conditioning?: number
  disposal?: number
}

interface ValueByLiquidHandlingType {
  aspirate: number
  dispense: number
}
export const getTransferPlanAndReferenceVolumes = (args: {
  pipetteSpecs: PipetteV2Specs
  tiprackDefinition: LabwareDefinition2 | null
  volume: number
  path: PathOption
  numAspirateWells: number
  numDispenseWells: number
  aspirateAirGapByVolume: Array<[number, number]>
  conditioningByVolume: Array<[number, number]> | null
  disposalByVolume: Array<[number, number]> | null
}): {
  referenceVolumes: ReferenceVolumes
  multiWellHandling: {
    isSupported: boolean
    numWellsToFitInTip?: number
  }
} => {
  const {
    path,
    volume,
    pipetteSpecs,
    tiprackDefinition,
    conditioningByVolume,
    disposalByVolume,
    numDispenseWells,
    numAspirateWells,
    aspirateAirGapByVolume,
  } = args
  const { liquids } = pipetteSpecs
  const isInLowVolumeMode =
    volume < liquids.default.minVolume && 'lowVolumeDefault' in liquids
  const maxWorkingVolumePipette = isInLowVolumeMode
    ? liquids.lowVolumeDefault.maxVolume
    : liquids.default.maxVolume
  const maxWorkingVolumeTip = tiprackDefinition?.wells.A1.totalLiquidVolume
  const maxWorkingVolume =
    maxWorkingVolumeTip == null
      ? maxWorkingVolumePipette
      : Math.min(maxWorkingVolumePipette, maxWorkingVolumeTip)
  const minVolumeForMultiAspirateDispense = volume * 2
  const conditioningVolumeForMultiAspirateDispense =
    conditioningByVolume != null
      ? (linearInterpolate(
          minVolumeForMultiAspirateDispense,
          conditioningByVolume
        ) ?? 0)
      : 0

  const isCustomTiprack = tiprackDefinition?.namespace !== 'opentrons'
  const isMultiDispenseAvailable =
    isCustomTiprack ||
    (conditioningByVolume != null &&
      disposalByVolume != null &&
      maxWorkingVolume >=
        minVolumeForMultiAspirateDispense +
          conditioningVolumeForMultiAspirateDispense +
          (linearInterpolate(
            minVolumeForMultiAspirateDispense,
            disposalByVolume
          ) ?? 0) +
          // don't take air gap into account if conditioning volume is present
          (conditioningVolumeForMultiAspirateDispense === 0
            ? (linearInterpolate(
                minVolumeForMultiAspirateDispense,
                aspirateAirGapByVolume
              ) ?? 0)
            : 0))
  const isMultiAspirateAvailable =
    maxWorkingVolume >= minVolumeForMultiAspirateDispense

  if (path === 'multiAspirate' && numAspirateWells <= numDispenseWells) {
    console.warn(
      'Invalid combination of source and destination wells for multiAspirate path'
    )
  } else if (path === 'multiDispense' && numAspirateWells >= numDispenseWells) {
    console.warn(
      'Invalid combination of source and destination wells for multiDispense path'
    )
  } else if (path === 'single' && numAspirateWells !== numDispenseWells) {
    console.warn(
      'Invalid combination of source and destination wells for single path'
    )
  }

  // early return if multiAspirate/multiDispense cannot be accommodated
  if (
    path === 'single' ||
    (path === 'multiDispense' && !isMultiDispenseAvailable) ||
    (path === 'multiAspirate' && !isMultiAspirateAvailable)
  ) {
    const aspirateAirGapAtSpecifiedVolume =
      linearInterpolate(volume, aspirateAirGapByVolume) ?? 0
    // split if target volume + air gap volume > maxWorkingVolume
    const numAspirations = Math.ceil(
      (volume + aspirateAirGapAtSpecifiedVolume) / maxWorkingVolume
    )
    const volumePerAspiration = volume / numAspirations
    return {
      referenceVolumes: {
        airGap: {
          aspirate: volumePerAspiration,
          dispense: 0,
        },
        correction: {
          aspirate: volumePerAspiration,
          dispense: volumePerAspiration,
        },
        pushOut: volumePerAspiration,
        flowRate: {
          aspirate: volumePerAspiration,
          dispense: volumePerAspiration,
        },
      },
      multiWellHandling: {
        isSupported: false,
      },
    }
  }

  if (path === 'multiDispense') {
    let totalVolumeForMultiDispense: number = 0
    let numDestinationsPerAspiration: number = 0
    for (let i = 0; i < numDispenseWells; i++) {
      const next = _getTotalVolumeForMultiDispense(
        (i + 1) * volume,
        conditioningByVolume ?? [],
        disposalByVolume ?? []
      )
      if (next > maxWorkingVolume) {
        break
      } else {
        totalVolumeForMultiDispense = (i + 1) * volume
        numDestinationsPerAspiration += 1
      }
    }
    return {
      referenceVolumes: {
        airGap: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? [],
            false
          ),
          dispense: _getTotalVolumeForMultiDispense(
            // here, we interpolate the post-dispense air gap volume based on the total volume in the tip
            // after the first dispense
            (numDestinationsPerAspiration - 1) * volume,
            conditioningByVolume ?? [],
            disposalByVolume ?? [],
            false
          ),
        },
        correction: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? []
          ),
          dispense: volume,
        },
        flowRate: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? []
          ),
          dispense: volume,
        },
        pushOut: volume,
        conditioning: totalVolumeForMultiDispense,
        disposal: totalVolumeForMultiDispense,
      },
      multiWellHandling: {
        isSupported: true,
        numWellsToFitInTip: numDestinationsPerAspiration,
      },
    }
  }

  // path is valid multiAspirate
  const maxSourcesPerAspiration = Math.floor(maxWorkingVolume / volume)
  const sourcesPerAspiration = Math.min(
    maxSourcesPerAspiration,
    numAspirateWells
  )
  const volumeTotalAspiration = sourcesPerAspiration * volume

  return {
    referenceVolumes: {
      airGap: {
        // here, we interpolate the post-aspirate air gap volume based on the total volume in the tip
        // after the final aspiration
        aspirate: volumeTotalAspiration,
        dispense: 0,
      },
      pushOut: volumeTotalAspiration,
      correction: {
        aspirate: volumeTotalAspiration,
        dispense: volumeTotalAspiration,
      },
      flowRate: {
        aspirate: volume,
        dispense: volumeTotalAspiration,
      },
    },
    multiWellHandling: {
      isSupported: true,
      numWellsToFitInTip: sourcesPerAspiration,
    },
  }
}

export const getIsRetractSafeForAirGap = (args: {
  retractZOffset: number
  retractPositionReference: PositionReference
  labwareEntities: LabwareEntities
  labwareId: string
  well: string | null
}): boolean => {
  const {
    retractZOffset,
    retractPositionReference,
    labwareId,
    labwareEntities,
    well,
  } = args
  if (well == null) {
    return false
  }
  const wellDepth = labwareEntities[labwareId]?.def.wells[well]?.depth
  if (wellDepth == null) {
    return false
  }
  const retractMmFromBottom = getMmFromBottom(
    retractZOffset,
    retractPositionReference,
    wellDepth
  )
  if (retractMmFromBottom == null) {
    return false
  }
  const retractZOffsetFromTop = retractMmFromBottom - wellDepth
  return retractZOffsetFromTop >= SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM
}

export const getStackForLabwareLocation = (
  locationSequence: LabwareLocationSequence
): string[] =>
  locationSequence.reduce<string[]>((acc, item) => {
    const { kind } = item
    if (kind === 'onCutoutFixture') {
      return acc
    }
    if (kind === 'onLabware') {
      return [...acc, item.labwareId]
    }
    if (kind === 'onModule' || kind === 'inStackerHopper') {
      return [...acc, item.moduleId]
    }
    if (kind === 'onAddressableArea') {
      return [...acc, item.addressableAreaName]
    }
    return [...acc, item.logicalLocationName]
  }, [])

const FOURTH_COLUMN_TO_CUTOUT_MAP = {
  A4: 'cutoutA3',
  B4: 'cutoutB3',
  C4: 'cutoutC3',
  D4: 'cutoutD3',
}

export function createStagingAreaForInvariantContext(
  params:
    | LoadLidStackRunTimeCommand['params']
    | LoadLabwareRunTimeCommand['params']
    | LoadLidParams
): StagingAreaEntities {
  if (
    params.location !== 'offDeck' &&
    params.location !== 'systemLocation' &&
    params.location !== 'wasteChuteLocation' &&
    'addressableAreaName' in params.location &&
    STAGING_AREA_SLOTS.includes(params.location.addressableAreaName)
  ) {
    const id = uuid()
    const addressableAreaName = params.location.addressableAreaName
    const location =
      FOURTH_COLUMN_TO_CUTOUT_MAP[
        addressableAreaName as keyof typeof FOURTH_COLUMN_TO_CUTOUT_MAP
      ] ?? addressableAreaName // fallback if the addressableArea name doesn't match the map, but shoudln't run into this

    return {
      [id]: { id, location },
    }
  }
  return {}
}

export const getLabwareIdOnHopper = (
  labware: {
    [labwareId: string]: LabwareTemporalProperties
  },
  moduleSlotLocation: string
): string => {
  const largestStackInSlot = getLargestStackInSlot(labware, moduleSlotLocation)
  const indexOfHopper = largestStackInSlot.indexOf(HOPPER_STACKER_LOCATION)
  const labwareIdOnModule = largestStackInSlot[indexOfHopper - 1]
  return labwareIdOnModule
}

export const getIsSlotAHopper = (slot: string): boolean => {
  return HOPPER_FAKE_LOCATIONS.includes(slot)
}

export const getIsSlotAVacuumDock = (slot: string): boolean => {
  return slot === VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA
}

export const getLabwareIdOnShuttle = (
  stackerState: FlexStackerModuleState
): string | null => {
  return stackerState.labwareOnShuttle?.primaryLabwareId ?? null
}

export const labwareMatchesLabwareInHopper = (
  labwareId: string,
  invariantContext: InvariantContext,
  stackerState: FlexStackerModuleState | null
): boolean => {
  // permissive if no stored labware details configured
  if (stackerState?.storedLabwareDetails == null) {
    return true
  }
  const storedLabwareURIs = Object.values(
    stackerState?.storedLabwareDetails ?? {}
  ).reduce<string[]>((acc, val) => {
    return val != null ? [...acc, val] : acc
  }, [])
  const labwareEntity = invariantContext.labwareEntities[labwareId]
  return storedLabwareURIs.some(uri => labwareEntity?.labwareDefURI === uri)
}

export const getIsSpaceInHopper = (
  stackerState: FlexStackerModuleState | null,
  labwareEntities: LabwareEntities
): boolean => {
  const { storedLabwareDetails } = stackerState ?? {}
  if (storedLabwareDetails == null) {
    return true
  }
  const { primaryLabwareURI, adapterLabwareURI, lidLabwareURI } =
    storedLabwareDetails
  const primaryLabwareEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === primaryLabwareURI
  )
  const adapterLabwareEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === adapterLabwareURI
  )
  const lidLabwareEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === lidLabwareURI
  )
  if (primaryLabwareEntity == null) {
    console.error('Primary labware entity not found')
    return false
  }

  const maximumAllowedLabware = getMaxPoolCount({
    labwareDefinitions: {
      primary: primaryLabwareEntity.def,
      adapter: adapterLabwareEntity?.def ?? null,
      lid: lidLabwareEntity?.def ?? null,
    },
    model: FLEX_STACKER_MODULE_V1,
  })
  const labwareStored = stackerState?.labwareInHopper
  const numberOfLabwareStored = labwareStored?.length ?? 0
  return maximumAllowedLabware > numberOfLabwareStored
}
