import intersection from 'lodash/intersection'
import { v4 as uuidv4 } from 'uuid'

import {
  ALL,
  getAllDefinitions,
  getLabwareDefURI,
  orderWells,
  POSITION_REFERENCE_BOTTOM,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'
import {
  AUTOMATIC,
  getDefaultPrimaryNozzle,
  getSlotInLocationStack,
  makeInitialRobotState,
} from '@opentrons/step-generation'

import { DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP } from '../constants'

import type {
  CutoutConfig,
  DeckConfiguration,
  LabwareDefinition,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  ConsolidateArgs,
  DistributeArgs,
  InvariantContext,
  LabwareEntities,
  PipetteEntities,
  RobotState,
  SharedTransferLikeArgs,
  TransferArgs,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'
import type { QuickTransferSummaryState } from '../types'

export type MoveLiquidStepArgs =
  ConsolidateArgs | DistributeArgs | TransferArgs | null

const uuid: () => string = uuidv4
const adapter96ChannelDefUri = 'opentrons/opentrons_flex_96_tiprack_adapter/1'

function getOrderedWells(
  unorderedWells: string[],
  labwareDef: LabwareDefinition
): string[] {
  const allWellsOrdered = orderWells(labwareDef.ordering, 't2b', 'l2r')
  return intersection(allWellsOrdered, unorderedWells)
}

export function getInvariantContextAndRobotState(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration
): { invariantContext: InvariantContext; robotState: RobotState } {
  const tipRackDefURI = getLabwareDefURI(quickTransferState.tipRack)
  let pipetteName = quickTransferState.pipette.model
  // we have to special case the peek pipette as it doesn't follow
  // our pipette definition naming conventions
  if (quickTransferState.pipette.displayName === 'FLEX 8-Channel EM 1000 µL') {
    pipetteName = 'p1000_multi_em_flex'
  } else if (quickTransferState.pipette.channels === 1) {
    pipetteName = pipetteName + `_single_flex`
  } else if (quickTransferState.pipette.channels === 8) {
    pipetteName = pipetteName + `_multi_flex`
  } else {
    pipetteName = pipetteName + `_96`
  }
  const pipetteId = `${uuid()}_${pipetteName}`
  const tipRackId = `${uuid()}_${tipRackDefURI}`

  const pipetteEntities: PipetteEntities = {
    [pipetteId]: {
      name: pipetteName as PipetteName,
      id: pipetteId,
      tiprackDefURI: [tipRackDefURI],
      tiprackLabwareDef: [quickTransferState.tipRack],
      spec: quickTransferState.pipette,
      pythonName: 'pipette',
    },
  }
  const pipetteLocations: RobotState['pipettes'] = {
    [pipetteId]: {
      mount: quickTransferState.mount,
    },
  }
  const sourceLabwareURI = getLabwareDefURI(quickTransferState.source)
  const sourceLabwareId = `${uuid()}_${sourceLabwareURI}`
  const pythonTrashBinName = 'trash_bin_1'
  const pythonWasteChuteName = 'waste_chute'

  let labwareEntities: LabwareEntities = {}
  let labwareLocations: RobotState['labware'] = {}
  let adapterId: string | null = null

  if (quickTransferState.pipette.channels === 96) {
    adapterId = `${uuid()}_${adapter96ChannelDefUri}`
    labwareEntities = {
      [adapterId]: {
        id: adapterId,
        labwareDefURI: adapter96ChannelDefUri,
        def: getAllDefinitions()[adapter96ChannelDefUri],
        pythonName: 'adapter_1',
      },
    }
    labwareLocations = {
      [adapterId]: {
        stack: [adapterId, 'B2'],
      },
    }
  }
  const sourceDisplayCategory =
    quickTransferState.source.metadata.displayCategory
  const destDisplayCategory =
    quickTransferState.destination !== 'source'
      ? quickTransferState.destination.metadata.displayCategory
      : sourceDisplayCategory

  const isSameDisplayCategory = sourceDisplayCategory === destDisplayCategory

  labwareEntities = {
    ...labwareEntities,
    [tipRackId]: {
      id: tipRackId,
      labwareDefURI: tipRackDefURI,
      def: quickTransferState.tipRack,
      pythonName: 'tip_rack_1',
    },
    [sourceLabwareId]: {
      id: sourceLabwareId,
      labwareDefURI: sourceLabwareURI,
      def: quickTransferState.source,
      pythonName: `${sourceDisplayCategory}_1`,
    },
  }
  labwareLocations = {
    ...labwareLocations,
    [tipRackId]: {
      stack:
        adapterId != null ? [tipRackId, adapterId, 'B2'] : [tipRackId, 'B2'],
    },
    [sourceLabwareId]: {
      stack: [sourceLabwareId, 'C2'],
    },
  }

  if (quickTransferState.destination !== 'source') {
    const destLabwareURI = getLabwareDefURI(quickTransferState.destination)
    const destLabwareId = `${uuid()}_${destLabwareURI}`
    labwareEntities = {
      ...labwareEntities,
      [destLabwareId]: {
        id: destLabwareId,
        labwareDefURI: destLabwareURI,
        def: quickTransferState.destination,
        pythonName: isSameDisplayCategory
          ? `${destDisplayCategory}_2`
          : `${destDisplayCategory}_1`,
      },
    }
    labwareLocations = {
      ...labwareLocations,
      [destLabwareId]: {
        stack: [destLabwareId, 'D2'],
      },
    }
  }
  let trashBinEntities: TrashBinEntities = {}
  let wasteChuteEntities: WasteChuteEntities = {}

  // If the drop tip location is the tip rack, still a protocols needs to define a trash bin entity
  const dropTipIsTiprack =
    typeof quickTransferState.dropTipLocation === 'string' &&
    quickTransferState.dropTipLocation ===
      getLabwareDefURI(quickTransferState.tipRack)

  if (dropTipIsTiprack) {
    // check deck config for trash bin and waste chute
    const installedTrashBin = deckConfig.find(
      config => config.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
    )
    const installedWasteChute = deckConfig.find(config =>
      WASTE_CHUTE_FIXTURES.includes(config.cutoutFixtureId)
    )
    const trashBinLocation =
      installedTrashBin != null ? installedTrashBin.cutoutId : 'cutoutA3'
    const trashId = `${uuid()}_trashBin`
    const wasteChuteId = `${uuid()}_wasteChute`

    if (installedTrashBin != null) {
      trashBinEntities = {
        [trashId]: {
          id: trashId,
          location: trashBinLocation,
          pythonName: pythonTrashBinName,
        },
      }
    } else if (installedWasteChute != null) {
      wasteChuteEntities = {
        [wasteChuteId]: {
          id: wasteChuteId,
          location: installedWasteChute.cutoutId,
          pythonName: pythonWasteChuteName,
        },
      }
    }
  }

  if (
    typeof quickTransferState.dropTipLocation !== 'string' &&
    quickTransferState.dropTipLocation.cutoutFixtureId ===
      TRASH_BIN_ADAPTER_FIXTURE
  ) {
    const trashLocation = quickTransferState.dropTipLocation.cutoutId
    const trashId = `${uuid()}_trashBin`
    trashBinEntities = {
      [trashId]: {
        id: trashId,
        location: trashLocation,
        pythonName: pythonTrashBinName,
      },
    }
  }
  if (
    quickTransferState.blowOutDispense?.location != null &&
    quickTransferState.blowOutDispense.location !== 'source_well' &&
    quickTransferState.blowOutDispense.location !== 'dest_well' &&
    quickTransferState.blowOutDispense.location?.cutoutFixtureId ===
      TRASH_BIN_ADAPTER_FIXTURE
  ) {
    const trashLocation = quickTransferState.blowOutDispense.location.cutoutId
    const isSameTrash = Object.values(trashBinEntities).some(
      entity => entity.location === trashLocation
    )
    if (!isSameTrash) {
      const trashId = `${uuid()}_trashBin`
      trashBinEntities = {
        ...trashBinEntities,
        [trashId]: {
          id: trashId,
          location: trashLocation,
          pythonName: pythonTrashBinName,
        },
      }
    }
  }

  if (
    typeof quickTransferState.dropTipLocation !== 'string' &&
    WASTE_CHUTE_FIXTURES.includes(
      quickTransferState.dropTipLocation.cutoutFixtureId
    )
  ) {
    const wasteChuteLocation = quickTransferState.dropTipLocation.cutoutId
    const wasteChuteId = `${uuid()}_wasteChute`
    wasteChuteEntities = {
      [wasteChuteId]: {
        id: wasteChuteId,
        location: wasteChuteLocation,
        pythonName: pythonWasteChuteName,
      },
    }
  }
  if (
    quickTransferState.blowOutDispense?.location != null &&
    quickTransferState.blowOutDispense.location !== 'source_well' &&
    quickTransferState.blowOutDispense.location !== 'dest_well' &&
    WASTE_CHUTE_FIXTURES.includes(
      quickTransferState.blowOutDispense.location.cutoutFixtureId
    )
  ) {
    const wasteChuteLocation =
      quickTransferState.blowOutDispense.location.cutoutId
    const isSameChute = Object.values(wasteChuteEntities).some(
      entity => entity.location === wasteChuteLocation
    )
    if (!isSameChute) {
      const wasteChuteId = `${uuid()}_wasteChute`
      wasteChuteEntities = {
        [wasteChuteId]: {
          id: wasteChuteId,
          location: wasteChuteLocation,
          pythonName: pythonWasteChuteName,
        },
      }
    }
  }
  const invariantContext = {
    labwareEntities,
    moduleEntities: {},
    pipetteEntities,
    wasteChuteEntities,
    trashBinEntities,
    stagingAreaEntities: {},
    gripperEntities: {},
    liquidEntities: {},
    config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: false },
  }
  const moduleLocations = {}
  const robotState = makeInitialRobotState({
    invariantContext,
    labwareLocations,
    moduleLocations,
    pipetteLocations,
  })

  return { invariantContext, robotState }
}

export function generateQuickTransferArgs(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration
): {
  stepArgs: MoveLiquidStepArgs
  invariantContext: InvariantContext
  initialRobotState: RobotState
} {
  let sourceWells = getOrderedWells(
    quickTransferState.sourceWells,
    quickTransferState.source
  )
  const destLabwareDefinition =
    quickTransferState.destination === 'source'
      ? quickTransferState.source
      : quickTransferState.destination
  let destWells = getOrderedWells(
    quickTransferState.destinationWells,
    destLabwareDefinition
  )
  if (destWells != null) {
    if (
      quickTransferState.path === 'single' &&
      sourceWells.length !== destWells.length
    ) {
      if (sourceWells.length === 1) {
        sourceWells = Array(destWells.length).fill(sourceWells[0])
      } else if (destWells.length === 1) {
        destWells = Array(sourceWells.length).fill(destWells[0])
      }
    }
  }
  const { invariantContext, robotState } = getInvariantContextAndRobotState(
    quickTransferState,
    deckConfig
  )

  let blowoutLocation: string | undefined
  const blowOutDispenseLocation =
    quickTransferState.path === 'multiDispense'
      ? quickTransferState.disposalVolumeDispenseSettings?.blowOutLocation
      : quickTransferState.blowOutDispense?.location

  if (
    blowOutDispenseLocation != null &&
    blowOutDispenseLocation !== 'source_well' &&
    blowOutDispenseLocation !== 'dest_well' &&
    typeof blowOutDispenseLocation === 'object' &&
    'cutoutId' in blowOutDispenseLocation
  ) {
    const trashBinEntity = Object.values(
      invariantContext.trashBinEntities
    ).find(entity => {
      const blowoutObject = blowOutDispenseLocation as CutoutConfig
      return entity.location === blowoutObject.cutoutId
    })
    const wasteChuteEntity = Object.values(
      invariantContext.wasteChuteEntities
    ).find(entity => {
      const blowoutObject = blowOutDispenseLocation as CutoutConfig
      return entity.location === blowoutObject.cutoutId
    })
    const entity = trashBinEntity != null ? trashBinEntity : wasteChuteEntity
    blowoutLocation = entity?.id
  } else {
    blowoutLocation = blowOutDispenseLocation as string | undefined
  }

  const dropTipTrashBinLocationEntity = Object.values(
    invariantContext.trashBinEntities
  ).find(
    entity =>
      typeof quickTransferState.dropTipLocation !== 'string' &&
      entity.location === quickTransferState.dropTipLocation.cutoutId
  )
  const dropTipWasteChuteLocationEntity = Object.values(
    invariantContext.wasteChuteEntities
  ).find(
    entity =>
      typeof quickTransferState.dropTipLocation !== 'string' &&
      entity.location === quickTransferState.dropTipLocation.cutoutId
  )

  const dropTipIsTiprack =
    typeof quickTransferState.dropTipLocation === 'string' &&
    quickTransferState.dropTipLocation ===
      getLabwareDefURI(quickTransferState.tipRack)

  const dropTipLocation = (() => {
    if (dropTipIsTiprack) {
      return quickTransferState.dropTipLocation as string
    }
    if (dropTipTrashBinLocationEntity?.id != null) {
      return dropTipTrashBinLocationEntity.id
    }
    if (dropTipWasteChuteLocationEntity?.id != null) {
      return dropTipWasteChuteLocationEntity.id
    }
    return ''
  })()

  const pipetteEntity = Object.values(invariantContext.pipetteEntities)[0]
  const sourceLabwareId = Object.keys(robotState.labware).find(
    labwareId =>
      getSlotInLocationStack(robotState.labware[labwareId].stack) === 'C2'
  )
  const sourceLabwareEntity =
    sourceLabwareId != null
      ? invariantContext.labwareEntities[sourceLabwareId]
      : undefined
  let destLabwareEntity = sourceLabwareEntity
  if (quickTransferState.destination !== 'source') {
    const destinationLabwareId = Object.keys(robotState.labware).find(
      labwareId =>
        getSlotInLocationStack(robotState.labware[labwareId].stack) === 'D2'
    )
    destLabwareEntity =
      destinationLabwareId != null
        ? invariantContext.labwareEntities[destinationLabwareId]
        : undefined
  }

  const nozzles = ALL
  const touchTipAfterDispenseOffsetMmFromTop =
    quickTransferState.touchTipDispense ?? DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP

  const touchTipAfterAspirateOffsetMmFromTop =
    quickTransferState.touchTipAspirate ?? DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP

  const primaryNozzle = getDefaultPrimaryNozzle({
    nozzles,
    channels: pipetteEntity.spec.channels,
  })
  const commonFields: SharedTransferLikeArgs = {
    stepNumber: 1,
    primaryNozzle: primaryNozzle,
    pipette: pipetteEntity.id,
    volume: quickTransferState.volume,
    sourceLabware: sourceLabwareEntity?.id!,
    destLabware: destLabwareEntity?.id!,
    tipRack: pipetteEntity.tiprackDefURI[0],
    aspirateFlowRateUlSec: quickTransferState.aspirateFlowRate,
    dispenseFlowRateUlSec: quickTransferState.dispenseFlowRate,
    aspirateOffsetFromBottomMm: quickTransferState.tipPositionAspirate,
    dispenseOffsetFromBottomMm: quickTransferState.tipPositionDispense,
    blowoutLocation,
    blowoutOffsetFromTopMm: null,
    blowoutXPosition: null,
    blowoutYPosition: null,
    blowoutPositionReference: null,
    blowoutFlowRateUlSec:
      quickTransferState.path === 'multiDispense'
        ? (quickTransferState.disposalVolumeDispenseSettings?.flowRate ?? 0)
        : (quickTransferState.blowOutDispense?.flowRate ?? 0),
    changeTip: quickTransferState.changeTip,
    preWetTip: quickTransferState.preWetTip,
    aspirateDelay:
      quickTransferState.delayAspirate != null
        ? {
            seconds: quickTransferState.delayAspirate?.delayDuration,
          }
        : null,
    dispenseDelay:
      quickTransferState.delayDispense != null
        ? {
            seconds: quickTransferState.delayDispense?.delayDuration,
          }
        : null,
    aspirateAirGapVolume: quickTransferState.airGapAspirate ?? null,
    dispenseAirGapVolume: quickTransferState.airGapDispense ?? null,
    touchTipAfterAspirate: quickTransferState.touchTipAspirate != null,
    touchTipAfterAspirateSpeed:
      quickTransferState.touchTipAspirateSpeed ?? null,
    touchTipAfterAspirateOffsetMmFromTop,
    touchTipAfterDispense: quickTransferState.touchTipDispense != null,
    touchTipAfterDispenseOffsetMmFromTop,
    touchTipAfterDispenseSpeed:
      quickTransferState.touchTipDispenseSpeed ?? null,
    dropTipLocation,
    aspirateXOffset: 0,
    aspirateYOffset: 0,
    dispenseXOffset: 0,
    dispenseYOffset: 0,
    name: null,
    description: null,
    nozzles,
    pushOut: quickTransferState.pushOutDispense?.volume ?? 0,
    liquidClass:
      quickTransferState.liquidClassName !== 'none'
        ? quickTransferState.liquidClassName
        : null,
    aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
    aspirateZOffset: quickTransferState.tipPositionAspirate,
    aspirateSubmergeSpeed: quickTransferState.submergeAspirate?.speed ?? 0,
    aspirateSubmergeXOffset: 0,
    aspirateSubmergeYOffset: 0,
    aspirateSubmergeZOffset: quickTransferState.submergeAspirate?.position ?? 0,
    aspirateSubmergePositionReference:
      quickTransferState.submergeAspirate?.positionReference ??
      POSITION_REFERENCE_BOTTOM,
    aspirateSubmergeDelay:
      quickTransferState.submergeAspirate?.delayDuration != null
        ? { seconds: quickTransferState.submergeAspirate.delayDuration }
        : null,
    aspirateRetractSpeed: quickTransferState.retractAspirate?.speed ?? 0,
    aspirateRetractXOffset: 0,
    aspirateRetractYOffset: 0,
    aspirateRetractZOffset: quickTransferState.retractAspirate?.position ?? 0,
    aspirateRetractPositionReference:
      quickTransferState.retractAspirate?.positionReference ??
      POSITION_REFERENCE_BOTTOM,
    aspirateRetractDelay:
      quickTransferState.retractAspirate?.delayDuration != null
        ? { seconds: quickTransferState.retractAspirate.delayDuration }
        : null,
    dispensePositionReference: POSITION_REFERENCE_BOTTOM,
    dispenseZOffset: quickTransferState.tipPositionDispense,
    dispenseSubmergeSpeed: quickTransferState.submergeDispense?.speed ?? 0,
    dispenseSubmergeXOffset: 0,
    dispenseSubmergeYOffset: 0,
    dispenseSubmergeZOffset: quickTransferState.submergeDispense?.position ?? 0,
    dispenseSubmergePositionReference:
      quickTransferState.submergeDispense?.positionReference ??
      POSITION_REFERENCE_BOTTOM,
    dispenseSubmergeDelay:
      quickTransferState.submergeDispense?.delayDuration != null
        ? { seconds: quickTransferState.submergeDispense.delayDuration }
        : null,
    dispenseRetractSpeed: quickTransferState.retractDispense?.speed ?? 0,
    dispenseRetractXOffset: 0,
    dispenseRetractYOffset: 0,
    dispenseRetractZOffset: quickTransferState.retractDispense?.position ?? 0,
    dispenseRetractPositionReference:
      quickTransferState.retractDispense?.positionReference ??
      POSITION_REFERENCE_BOTTOM,
    dispenseRetractDelay:
      quickTransferState.retractDispense?.delayDuration != null
        ? { seconds: quickTransferState.retractDispense.delayDuration }
        : null,
    touchTipAfterAspirateMmFromEdge:
      quickTransferState.touchTipAspirate ?? null,
    touchTipAfterDispenseMmFromEdge:
      quickTransferState.touchTipDispense ?? null,
    // Tip selection not currently allowed in Quick Transfer, so we set to automatic
    tipTracking: AUTOMATIC,
    tipsSelected: [],
    tiprackSelected: null,
  }

  switch (quickTransferState.path) {
    case 'single': {
      const transferStepArguments: TransferArgs = {
        ...commonFields,
        commandCreatorFnName: 'transfer',
        sourceWells,
        destWells,
        aspirateDelay:
          quickTransferState.delayAspirate != null
            ? {
                seconds: quickTransferState.delayAspirate.delayDuration,
              }
            : null,
        dispenseDelay:
          quickTransferState.delayDispense != null
            ? {
                seconds: quickTransferState.delayDispense.delayDuration,
              }
            : null,
        mixBeforeAspirate:
          quickTransferState.mixOnAspirate != null
            ? {
                volume: quickTransferState.mixOnAspirate.mixVolume,
                times: quickTransferState.mixOnAspirate.repetitions,
              }
            : null,
        mixInDestination:
          quickTransferState.mixOnDispense != null
            ? {
                volume: quickTransferState.mixOnDispense.mixVolume,
                times: quickTransferState.mixOnDispense.repetitions,
              }
            : null,
      }
      return {
        stepArgs: transferStepArguments,
        invariantContext,
        initialRobotState: robotState,
      }
    }

    case 'multiAspirate': {
      const consolidateStepArguments: ConsolidateArgs = {
        ...commonFields,
        commandCreatorFnName: 'consolidate',
        mixFirstAspirate:
          quickTransferState.mixOnAspirate != null
            ? {
                volume: quickTransferState.mixOnAspirate.mixVolume,
                times: quickTransferState.mixOnAspirate.repetitions,
              }
            : null,
        mixInDestination:
          quickTransferState.mixOnDispense != null
            ? {
                volume: quickTransferState.mixOnDispense.mixVolume,
                times: quickTransferState.mixOnDispense.repetitions,
              }
            : null,
        sourceWells,
        destWell: destWells[0],
      }
      return {
        stepArgs: consolidateStepArguments,
        invariantContext,
        initialRobotState: robotState,
      }
    }

    case 'multiDispense': {
      const distributeStepArguments: DistributeArgs = {
        ...commonFields,
        commandCreatorFnName: 'distribute',
        disposalVolume:
          quickTransferState.disposalVolumeDispenseSettings?.volume ?? null,
        mixBeforeAspirate:
          quickTransferState.mixOnAspirate != null
            ? {
                volume: quickTransferState.mixOnAspirate.mixVolume,
                times: quickTransferState.mixOnAspirate.repetitions,
              }
            : null,
        sourceWell: sourceWells[0],
        destWells,
        conditioningVolume: quickTransferState.conditionAspirate ?? null,
      }
      return {
        stepArgs: distributeStepArguments,
        invariantContext,
        initialRobotState: robotState,
      }
    }
  }
}
