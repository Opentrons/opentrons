import { getModuleType } from '@opentrons/shared-data'
import { getStackedOnNodeFromPdStack } from '@opentrons/step-generation'

import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import { getLocationStackTopToBottom, getModulePythonName } from '../../utils'

import type {
  LoadedLabwareLocation,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { ModuleEntities, RobotState } from '@opentrons/step-generation'
import type { PDMetadata } from '../../file-types'

const moduleEntitiesFromMetadata = (
  modules: PDMetadata['modules']
): ModuleEntities =>
  Object.entries(modules).reduce<ModuleEntities>((acc, [id, { model }]) => {
    const moduleType = getModuleType(model)
    const typeCount = Object.values(acc).filter(
      m => m.type === moduleType
    ).length
    acc[id] = {
      id,
      type: moduleType,
      model,
      pythonName: getModulePythonName(moduleType, typeCount + 1),
    }
    return acc
  }, {})

/**
 * Adds `labwareStackedOnNodeUpdate` to the initial deck setup step (PE-shaped immediate parent per labware)
 * and bumps PD application version. Runtime deck setup also derives `stackedOnNode` from `stack` in selectors.
 */
export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }

  const { savedStepForms, labware, modules } = designerApplication.data
  const initialForm = savedStepForms[INITIAL_DECK_SETUP_STEP_ID] ?? {}
  const labwareLocationUpdate: Record<string, string> =
    initialForm.labwareLocationUpdate ?? {}
  const moduleLocationUpdate: Record<string, string> =
    initialForm.moduleLocationUpdate ?? {}

  const moduleEntities = moduleEntitiesFromMetadata(modules)
  const labwareEntityIds = new Set(Object.keys(labware))

  const modulesRobotState = Object.fromEntries(
    Object.entries(moduleLocationUpdate).map(([moduleId, slot]) => {
      const entity = moduleEntities[moduleId]
      return [
        moduleId,
        {
          slot,
          moduleState: { type: entity?.type },
        },
      ]
    })
  ) as RobotState['modules']

  const labwareStackedOnNodeUpdate = Object.keys(labwareLocationUpdate).reduce<
    Record<string, LoadedLabwareLocation>
  >((acc, labwareId) => {
    const stack = getLocationStackTopToBottom(
      labwareId,
      labwareLocationUpdate,
      moduleLocationUpdate,
      moduleEntities
    )
    const stackedOnNode = getStackedOnNodeFromPdStack({
      stack,
      subjectLabwareId: labwareId,
      moduleEntities,
      labwareEntityIds,
      modules: modulesRobotState,
    })
    if (stackedOnNode != null) {
      acc[labwareId] = stackedOnNode
    }
    return acc
  }, {})

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...savedStepForms,
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...initialForm,
            labwareStackedOnNodeUpdate,
          },
        },
      },
    },
  }
}
