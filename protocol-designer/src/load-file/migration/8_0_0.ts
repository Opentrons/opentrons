import mapValues from 'lodash/mapValues'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { getOnlyLatestDefs } from '../../labware-defs'
import { uuid } from '../../utils'
import {
  FLEX_TRASH_DEF_URI,
  INITIAL_DECK_SETUP_STEP_ID,
  OT_2_TRASH_DEF_URI,
} from '../../constants'
import type {
  LoadLabwareCreateCommand,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

// NOTE: this migration updates fixed trash by treating it as an entity
// additionally, drop tip location is now selectable
const PD_VERSION = '8.0.0'

interface LabwareLocationUpdate {
  [id: string]: string
}

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationData>
): ProtocolFile => {
  const { designerApplication, robot, commands, labwareDefinitions } = appData
  const labwareLocationUpdate: LabwareLocationUpdate =
    designerApplication?.data?.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
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

  const loadLabwareCommands: LoadLabwareCreateCommand[] = commands
    .filter(
      (command): command is LoadLabwareCreateCommand =>
        command.commandType === 'loadLabware'
    )
    .map(command => {
      //  protocols that do multiple migrations through 7.0.0 have a loadName === definitionURI
      //  this ternary below fixes that
      const loadName =
        labwareDefinitions[command.params.loadName] != null
          ? labwareDefinitions[command.params.loadName].parameters.loadName
          : command.params.loadName
      return {
        ...command,
        params: {
          ...command.params,
          loadName,
        },
      }
    })

  const migratedCommandsV8 = commands.filter(
    command => command.commandType !== 'loadLabware'
  )

  return {
    ...appData,
    designerApplication: {
      ...appData.designerApplication,
      version: PD_VERSION,
      data: {
        ...appData.designerApplication?.data,
        savedStepForms: {
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...appData.designerApplication?.data?.savedStepForms[
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
    labwareDefinitions: {
      ...{ [trashDefUri]: trashDefinition },
      ...appData.labwareDefinitions,
    },
    commands: [
      ...migratedCommandsV8,
      ...loadLabwareCommands,
      ...trashLoadCommand,
    ],
  }
}
