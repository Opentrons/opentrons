import mapValues from 'lodash/mapValues'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STANDARD_DECKID,
  OT2_STANDARD_DECKID,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { getOnlyLatestDefs } from '../../labware-defs'
import { uuid } from '../../utils'
import {
  FLEX_TRASH_DEF_URI,
  INITIAL_DECK_SETUP_STEP_ID,
  OT_2_TRASH_DEF_URI,
} from '../../constants'
import type { ProtocolFileV7 } from '@opentrons/shared-data'
import type {
  CommandAnnotationV1Mixin,
  CommandV8Mixin,
  LabwareV2Mixin,
  LiquidV1Mixin,
  LoadLabwareCreateCommand,
  OT2RobotMixin,
  OT3RobotMixin,
  ProtocolBase,
  ProtocolFile,
} from '@opentrons/shared-data/protocol/types/schemaV8'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

// NOTE: this migration is to schema v8 and updates fixed trash by
// treating it as an entity. Additionally, drop tip location is now selectable
const PD_VERSION = '8.0.0'
const SCHEMA_VERSION = 8
interface LabwareLocationUpdate {
  [id: string]: string
}

export const migrateFile = (
  appData: ProtocolFileV7<DesignerApplicationData>
): ProtocolFile => {
  const { designerApplication, commands, robot, liquids } = appData

  if (designerApplication == null || designerApplication.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }

  const labwareLocationUpdate: LabwareLocationUpdate =
    designerApplication.data.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      .labwareLocationUpdate
  const allLatestDefs = getOnlyLatestDefs()

  const robotType = robot.model
  const trashSlot = robotType === FLEX_ROBOT_TYPE ? 'A3' : '12'
  const trashDefUri =
    robotType === FLEX_ROBOT_TYPE ? FLEX_TRASH_DEF_URI : OT_2_TRASH_DEF_URI

  const trashDefinition = allLatestDefs[trashDefUri]
  const trashId = `${uuid()}:${trashDefUri}`

  const trashLoadCommand = [
    {
      key: uuid(),
      commandType: 'loadLabware',
      params: {
        location: { slotName: trashSlot },
        version: 1,
        namespace: 'opentrons',
        loadName: trashDefinition.parameters.loadName,
        displayName: trashDefinition.metadata.displayName,
        labwareId: trashId,
      },
    },
  ] as LoadLabwareCreateCommand[]

  const newLabwareLocationUpdate: LabwareLocationUpdate = Object.keys(
    labwareLocationUpdate
  ).reduce((acc: LabwareLocationUpdate, labwareId: string) => {
    if (labwareId === 'fixedTrash') {
      acc[trashId] = trashSlot
    } else {
      acc[labwareId] = labwareLocationUpdate[labwareId]
    }
    return acc
  }, {})

  const migrateSavedStepForms = (
    savedStepForms: Record<string, any>
  ): Record<string, any> => {
    return mapValues(savedStepForms, stepForm => {
      const sharedParams = {
        blowout_location:
          stepForm.blowout_location === 'fixedTrash'
            ? trashId
            : stepForm.blowout_location,
        dropTip_location: trashId,
      }

      if (stepForm.stepType === 'moveLiquid') {
        return {
          ...stepForm,
          aspirate_labware:
            stepForm.aspirate_labware === 'fixedTrash'
              ? trashId
              : stepForm.aspirate_labware,
          dispense_labware:
            stepForm.dispense_labware === 'fixedTrash'
              ? trashId
              : stepForm.dispense_labware,
          ...sharedParams,
        }
      } else if (stepForm.stepType === 'mix') {
        return {
          ...stepForm,
          labware:
            stepForm.labware === 'fixedTrash' ? trashId : stepForm.labware,
          ...sharedParams,
        }
      }

      return stepForm
    })
  }

  const filteredSavedStepForms = Object.fromEntries(
    Object.entries(
      appData.designerApplication?.data?.savedStepForms ?? {}
    ).filter(([key, value]) => key !== INITIAL_DECK_SETUP_STEP_ID)
  )
  const newFilteredSavedStepForms = migrateSavedStepForms(
    filteredSavedStepForms
  )

  const flexDeckSpec: OT3RobotMixin = {
    robot: {
      model: FLEX_ROBOT_TYPE,
      deckId: FLEX_STANDARD_DECKID,
    },
  }
  const ot2DeckSpec: OT2RobotMixin = {
    robot: {
      model: OT2_STANDARD_MODEL,
      deckId: OT2_STANDARD_DECKID,
    },
  }
  const deckStructure =
    robotType === FLEX_ROBOT_TYPE ? flexDeckSpec : ot2DeckSpec

  const protocolBase: ProtocolBase<DesignerApplicationData> = {
    $otSharedSchema: '#/protocol/schemas/8',
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      ...appData.metadata,
    },
    designerApplication: {
      ...appData.designerApplication,
      version: PD_VERSION,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...designerApplication.data.savedStepForms[
              INITIAL_DECK_SETUP_STEP_ID
            ],
            labwareLocationUpdate: {
              ...newLabwareLocationUpdate,
            },
          },
          ...newFilteredSavedStepForms,
        },
      },
    },
  }

  const labwareV2Mixin: LabwareV2Mixin = {
    labwareDefinitionSchemaId: 'opentronsLabwareSchemaV2',
    labwareDefinitions: {
      ...{ [trashDefUri]: trashDefinition },
      ...appData.labwareDefinitions,
    },
  }

  const liquidV1Mixin: LiquidV1Mixin = {
    liquidSchemaId: 'opentronsLiquidSchemaV1',
    liquids,
  }

  const commandv8Mixin: CommandV8Mixin = {
    commandSchemaId: 'opentronsCommandSchemaV8',
    commands: [...commands, ...trashLoadCommand],
  }

  const commandAnnotionaV1Mixin: CommandAnnotationV1Mixin = {
    commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV1',
    commandAnnotations: [],
  }

  return {
    ...protocolBase,
    ...deckStructure,
    ...labwareV2Mixin,
    ...liquidV1Mixin,
    ...commandv8Mixin,
    ...commandAnnotionaV1Mixin,
  }
}
