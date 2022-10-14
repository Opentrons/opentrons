import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { SECTIONS } from '../constants'
import {
  getAllUniqLocationsForLabware,
  getLabwareDefinitionsFromCommands,
} from './labware'
import {
  getLabwareDefURI,
  getIsTiprack,
  getSlotHasMatingSurfaceUnitVector,
  FIXED_TRASH_ID,
} from '@opentrons/shared-data'

import type {
  LabwarePositionCheckStep,
  CheckTipRacksStep,
  PickUpTipStep,
  CheckLabwareStep,
  ReturnTipStep,
} from '../types'
import type {
  RunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type {
  LabwareLocation,
  LoadModuleRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { getLabwareLocationCombos } from '../../ApplyHistoricOffsets/hooks/getLabwareLocationCombos'

interface LPCArgs {
  primaryPipetteId: string
  secondaryPipetteId: string | null
  labware: ProtocolAnalysisOutput['labware']
  modules: ProtocolAnalysisOutput['modules']
  commands: RunTimeCommand[]
}

const OT2_STANDARD_DECK_DEF = standardDeckDef as any

const PICK_UP_TIP_LOCATION: LabwareLocation = { slotName: '2' }

export const getCheckSteps = (args: LPCArgs): LabwarePositionCheckStep[] => {
  const checkTipRacksSectionSteps = getCheckTipRackSectionSteps(args)
  if (checkTipRacksSectionSteps.length < 1) return []

  const lastTiprackCheckStep =
    checkTipRacksSectionSteps[checkTipRacksSectionSteps.length - 1]
  const pickUpTipSectionStep: PickUpTipStep = {
    section: SECTIONS.PICK_UP_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
    location: PICK_UP_TIP_LOCATION,
  }

  const checkLabwareSectionSteps = getCheckLabwareSectionSteps(args)

  const returnTipSectionStep: ReturnTipStep = {
    section: SECTIONS.RETURN_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
    location: PICK_UP_TIP_LOCATION,
  }

  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    ...checkTipRacksSectionSteps,
    pickUpTipSectionStep,
    ...checkLabwareSectionSteps,
    returnTipSectionStep,
    { section: SECTIONS.RESULTS_SUMMARY },
  ]
}

function getCheckTipRackSectionSteps(args: LPCArgs): CheckTipRacksStep[] {
  const { secondaryPipetteId, primaryPipetteId, commands, labware, modules } = args

  const labwareLocationCombos = getLabwareLocationCombos(commands, labware, modules)
  const pickUpTipCommands = commands.filter(
    (command): command is PickUpTipRunTimeCommand =>
      command.commandType === 'pickUpTip'
  )

  const uniqPickUpTipCommands = pickUpTipCommands.reduce<
    PickUpTipRunTimeCommand[]
  >((acc, pickUpTipCommand) => {
    if (
      (pickUpTipCommand.params.pipetteId === primaryPipetteId &&
        acc.some(
          c => c.params.labwareId === pickUpTipCommand.params.labwareId
        )) ||
      (pickUpTipCommand.params.pipetteId === secondaryPipetteId &&
        pickUpTipCommands.some(
          c =>
            c.params.labwareId === pickUpTipCommand.params.labwareId &&
            c.params.pipetteId === primaryPipetteId
        ))
    ) {
      return acc
    }
    return [...acc, pickUpTipCommand]
  }, [])

  return uniqPickUpTipCommands.reduce<CheckTipRacksStep[]>(
    (acc, { params }) => {
      const labwareLocations = labwareLocationCombos.filter(combo => combo.labwareId === params.labwareId)
      return [
        ...acc,
        ...labwareLocations.map(({ location }) => ({
          section: SECTIONS.CHECK_TIP_RACKS,
          labwareId: params.labwareId,
          pipetteId: params.pipetteId,
          location,
        })),
      ]
    },
    []
  )
}

function getCheckLabwareSectionSteps(args: LPCArgs): CheckLabwareStep[] {
  const { labware, modules, commands, primaryPipetteId } = args
  const labwareDefinitions = getLabwareDefinitionsFromCommands(commands)

  return labware.reduce<CheckLabwareStep[]>((acc, currentLabware) => {
    const labwareDef = labwareDefinitions.find(
      def => getLabwareDefURI(def) === currentLabware.definitionUri
    )
    if (currentLabware.id === FIXED_TRASH_ID) return acc
    if (labwareDef == null) {
      throw new Error(
        `could not find labware definition within protocol with uri: ${currentLabware.definitionUri}`
      )
    }
    const isTiprack = getIsTiprack(labwareDef)
    if (isTiprack) return acc // skip any labware that is a tiprack

    const labwareLocationCombos = getLabwareLocationCombos(commands, labware, modules)
    console.log('LABWARE COMBOS', labwareLocationCombos)
    return [
      ...acc,
      ...labwareLocationCombos.reduce<CheckLabwareStep[]>((innerAcc, { location, labwareId }) => {
        if (
          !getSlotHasMatingSurfaceUnitVector(OT2_STANDARD_DECK_DEF, location.slotName) || labwareId !== currentLabware.id
        ) {
          return innerAcc
        }

        return [
          ...innerAcc,
          {
            section: SECTIONS.CHECK_LABWARE,
            labwareId,
            pipetteId: primaryPipetteId,
            location,
          },
        ]
      }, []),
    ]
  }, [])
}
