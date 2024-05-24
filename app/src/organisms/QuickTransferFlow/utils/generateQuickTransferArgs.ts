import uuidv1 from 'uuid/v4'
import intersection from 'lodash/intersection'
import {
  orderWells,
  getLabwareDefURI,
  getTipTypeFromTipRackDefinition,
} from '@opentrons/shared-data'
import { makeInitialRobotState } from '@opentrons/step-generation'
import type { QuickTransferSummaryState } from '../types'
import type {
  LabwareDefinition2,
  DeckConfiguration,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  ConsolidateArgs,
  DistributeArgs,
  TransferArgs,
  InvariantContext,
  PipetteEntities,
  LabwareEntities,
  RobotState,
  AdditionalEquipmentEntities,
} from '@opentrons/step-generation'

type MoveLiquidStepArgs = ConsolidateArgs | DistributeArgs | TransferArgs | null

const uuid: () => string = uuidv1

function getOrderedWells(
  unorderedWells: string[],
  labwareDef: LabwareDefinition2
): string[] {
  const allWellsOrdered = orderWells(labwareDef.ordering, 't2b', 'l2r')
  return intersection(allWellsOrdered, unorderedWells)
}

function getInvariantContextAndRobotState(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration
): { invariantContext: InvariantContext; robotState: RobotState } {
  const pipetteId = uuid()
  const tipRackId = uuid()
  const tipRackDefURI = getLabwareDefURI(quickTransferState.tipRack)
  let pipetteName = quickTransferState.pipette.model
  if (quickTransferState.pipette.channels === 1) {
    pipetteName = pipetteName + `_single_flex`
  } else if (quickTransferState.pipette.channels === 8) {
    pipetteName = pipetteName + `_multi_flex`
  } else {
    pipetteName = pipetteName + `_96`
  }

  const pipetteEntities: PipetteEntities = {
    [pipetteId]: {
      name: pipetteName as PipetteName,
      id: pipetteId,
      tiprackDefURI: [tipRackDefURI],
      tiprackLabwareDef: [quickTransferState.tipRack],
      spec: quickTransferState.pipette,
    },
  }
  const pipetteLocations: RobotState['pipettes'] = {
    [pipetteId]: {
      mount: quickTransferState.mount,
    },
  }
  const sourceLabwareId = uuid()
  const sourceLabwareURI = getLabwareDefURI(quickTransferState.source)

  // first labware entity will always be tiprack, second will always be source
  let labwareEntities: LabwareEntities = {
    [tipRackId]: {
      id: tipRackId,
      labwareDefURI: tipRackDefURI,
      def: quickTransferState.tipRack,
    },
    [sourceLabwareId]: {
      id: sourceLabwareId,
      labwareDefURI: sourceLabwareURI,
      def: quickTransferState.source,
    },
  }
  let labwareLocations: RobotState['labware'] = {
    [tipRackId]: {
      slot: 'B2',
    },
    [sourceLabwareId]: {
      slot: 'C2',
    },
  }
  // if dest labware is not source, third labware entity will be the destination
  if (quickTransferState.destination !== 'source') {
    const destLabwareId = uuid()
    labwareEntities = {
      ...labwareEntities,
      [destLabwareId]: {
        id: destLabwareId,
        labwareDefURI: getLabwareDefURI(quickTransferState.destination),
        def: quickTransferState.destination,
      },
    }
    labwareLocations = {
      ...labwareLocations,
      [destLabwareId]: {
        slot: 'D2',
      },
    }
  }
  let additionalEquipmentEntities: AdditionalEquipmentEntities = {}
  if (
    quickTransferState.dropTipLocation === 'trashBin' ||
    quickTransferState.blowOut === 'trashBin'
  ) {
    const trashLocation = deckConfig.find(
      configCutout => configCutout.cutoutFixtureId === 'trashBinAdapter'
    )?.cutoutId
    const trashId = uuid()
    additionalEquipmentEntities = {
      [trashId]: {
        name: 'trashBin',
        id: trashId,
        location: trashLocation,
      },
    }
  }
  if (
    quickTransferState.dropTipLocation === 'wasteChute' ||
    quickTransferState.blowOut === 'wasteChute'
  ) {
    const wasteChuteLocation = deckConfig.find(
      configCutout =>
        configCutout.cutoutFixtureId.includes('WasteChute') ||
        configCutout.cutoutFixtureId.includes('wasteChute')
    )?.cutoutId
    const wasteChuteId = uuid()
    additionalEquipmentEntities = {
      ...additionalEquipmentEntities,
      [wasteChuteId]: {
        name: 'wasteChute',
        id: wasteChuteId,
        location: wasteChuteLocation,
      },
    }
  }

  const invariantContext = {
    labwareEntities,
    moduleEntities: {},
    pipetteEntities,
    additionalEquipmentEntities: additionalEquipmentEntities,
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

  // this cannot be 'dest_well' for multiDispense
  let blowoutLocation = quickTransferState.blowOut
  if (quickTransferState.blowOut === 'trashBin') {
    const trashBinEntity = Object.values(
      invariantContext.additionalEquipmentEntities
    ).find(entity => entity.name === 'trashBin')
    blowoutLocation = trashBinEntity?.id
  } else if (quickTransferState.blowOut === 'wasteChute') {
    const wasteChuteEntity = Object.values(
      invariantContext.additionalEquipmentEntities
    ).find(entity => entity.name === 'wasteChute')
    blowoutLocation = wasteChuteEntity?.id
  }

  let dropTipLocation = quickTransferState.dropTipLocation
  if (quickTransferState.dropTipLocation === 'trashBin') {
    const trashBinEntity = Object.values(
      invariantContext.additionalEquipmentEntities
    ).find(entity => entity.name === 'trashBin')
    dropTipLocation = trashBinEntity?.id ?? 'trashBin'
  } else if (quickTransferState.dropTipLocation === 'wasteChute') {
    const wasteChuteEntity = Object.values(
      invariantContext.additionalEquipmentEntities
    ).find(entity => entity.name === 'wasteChute')
    dropTipLocation = wasteChuteEntity?.id ?? 'wasteChute'
  }

  const tipType = getTipTypeFromTipRackDefinition(quickTransferState.tipRack)
  const flowRatesForSupportedTip =
    quickTransferState.pipette.liquids.default.supportedTips[tipType]
  const pipetteEntityValues = Object.values(invariantContext.pipetteEntities)
  const labwareEntityValues = Object.values(invariantContext.labwareEntities)
  const commonFields = {
    pipette: pipetteEntityValues[0].id,
    volume: quickTransferState.volume,
    sourceLabware: labwareEntityValues[1].id,
    destLabware:
      labwareEntityValues.length > 2
        ? labwareEntityValues[2].id
        : labwareEntityValues[1].id,
    tipRack: pipetteEntityValues[0].tiprackDefURI[0],
    aspirateFlowRateUlSec: quickTransferState.aspirateFlowRate,
    dispenseFlowRateUlSec: quickTransferState.dispenseFlowRate,
    aspirateOffsetFromBottomMm: quickTransferState.tipPositionAspirate,
    dispenseOffsetFromBottomMm: quickTransferState.tipPositionDispense,
    blowoutLocation,
    blowoutFlowRateUlSec:
      flowRatesForSupportedTip.defaultBlowOutFlowRate.default,
    blowoutOffsetFromTopMm: 0,
    changeTip: quickTransferState.changeTip,
    preWetTip: quickTransferState.preWetTip,
    aspirateDelay:
      quickTransferState.delayAspirate != null
        ? {
            seconds: quickTransferState.delayAspirate?.delayDuration,
            mmFromBottom: quickTransferState.delayAspirate.positionFromBottom,
          }
        : null,
    dispenseDelay:
      quickTransferState.delayDispense != null
        ? {
            seconds: quickTransferState.delayDispense?.delayDuration,
            mmFromBottom: quickTransferState.delayDispense.positionFromBottom,
          }
        : null,
    aspirateAirGapVolume: quickTransferState.airGapAspirate ?? null,
    dispenseAirGapVolume: quickTransferState.airGapDispense ?? null,
    touchTipAfterAspirate: quickTransferState.touchTipAspirate != null,
    touchTipAfterAspirateOffsetMmFromBottom:
      quickTransferState.touchTipAspirate != null
        ? quickTransferState.touchTipAspirate
        : 0,
    touchTipAfterDispense: quickTransferState.touchTipDispense != null,
    touchTipAfterDispenseOffsetMmFromBottom:
      quickTransferState.touchTipDispense != null
        ? quickTransferState.touchTipDispense
        : 0,
    dropTipLocation,
    aspirateXOffset: 0,
    aspirateYOffset: 0,
    dispenseXOffset: 0,
    dispenseYOffset: 0,
    name: null,
    description: null,
    nozzles: null,
  }

  switch (quickTransferState.path) {
    case 'single': {
      const transferStepArguments: TransferArgs = {
        ...commonFields,
        commandCreatorFnName: 'transfer',
        sourceWells,
        destWells,
        mixBeforeAspirate:
          quickTransferState.mixOnAspirate != null
            ? {
                volume: quickTransferState.mixOnAspirate.mixVolume,
                times: quickTransferState.mixOnAspirate.repititions,
              }
            : null,
        mixInDestination:
          quickTransferState.mixOnDispense != null
            ? {
                volume: quickTransferState.mixOnDispense.mixVolume,
                times: quickTransferState.mixOnDispense.repititions,
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
                times: quickTransferState.mixOnAspirate.repititions,
              }
            : null,
        mixInDestination:
          quickTransferState.mixOnDispense != null
            ? {
                volume: quickTransferState.mixOnDispense.mixVolume,
                times: quickTransferState.mixOnDispense.repititions,
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
        disposalVolume: quickTransferState.volume,
        mixBeforeAspirate:
          quickTransferState.mixOnAspirate != null
            ? {
                volume: quickTransferState.mixOnAspirate.mixVolume,
                times: quickTransferState.mixOnAspirate.repititions,
              }
            : null,
        sourceWell: sourceWells[0],
        destWells: destWells,
      }
      return {
        stepArgs: distributeStepArguments,
        invariantContext,
        initialRobotState: robotState,
      }
    }
  }
}
