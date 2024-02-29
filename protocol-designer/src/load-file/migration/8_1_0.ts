import type {
  LoadLabwareCreateCommand,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

export interface DesignerApplicationDataV8 {
  ingredients: Record<
    string,
    {
      name?: string | null
      description?: string | null
      serialize: boolean
    }
  >
  ingredLocations: {
    [labwareId: string]: {
      [wellName: string]: { [liquidId: string]: { volume: number } }
    }
  }
  savedStepForms: Record<string, any>
  orderedStepIds: string[]
  pipetteTiprackAssignments: Record<string, string>
}

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationDataV8>
): ProtocolFile<DesignerApplicationData> => {
  const { designerApplication, commands, labwareDefinitions } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }

  const tiprackAssignments = designerApplication.data
    ?.pipetteTiprackAssignments as Record<string, string>

  const newTiprackAssignments = Object.keys(tiprackAssignments).reduce(
    (acc: Record<string, string[]>, key) => {
      acc[key] = [tiprackAssignments[key]]
      return acc
    },
    {}
  )

  const loadLabwareCommands = commands.filter(
    (command): command is LoadLabwareCreateCommand =>
      command.commandType === 'loadLabware'
  )

  const savedStepForms = designerApplication.data
    ?.savedStepForms as DesignerApplicationData['savedStepForms']
  const pipettingSavedSteps = Object.values(savedStepForms).filter(
    form => form.stepName === 'transfer' || form.stepName === 'mix'
  )

  const pipettingSavedStepsWithTipRack = pipettingSavedSteps.reduce(
    (acc, item) => {
      const tipRackUri = tiprackAssignments[item.pipette]
      const tiprackLoadname =
        labwareDefinitions[tipRackUri]?.parameters.loadName
      if (tiprackLoadname == null) {
        console.error(
          `expected to find tiprack definition with labwareDefintionURI ${tipRackUri} but could not`
        )
      }
      const tiprackIds = loadLabwareCommands
        .filter(command => command.params.loadName === tiprackLoadname)
        .map(command => command.params.labwareId as string)

      //  TODO, figure out how to assign tipracks to each step when multiple tipracks
      //  of the same URI are involved
      acc[item.id] = { ...item, tipRack: tiprackIds[0] }
      return acc
    },
    {}
  )

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...pipettingSavedStepsWithTipRack,
        },
        pipetteTiprackAssignments: newTiprackAssignments,
      },
    },
  }
}
