import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import { createSelector } from 'reselect'

import { NONE_LIQUID_CLASS_NAME } from '@opentrons/shared-data'
import {
  PD_APPLICATION_VERSION,
  pythonCustomLabwareDict,
  pythonDefRun,
  pythonImports,
  pythonMetadata,
  pythonRequirements,
} from '@opentrons/step-generation'

import { selectors as dismissSelectors } from '../../dismiss'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
// NOTE: getStepGroups is for when we support step grouping in the future
// import { getStepGroups } from '../../step-forms/selectors'
import { selectors as uiLabwareSelectors } from '../../ui/labware'
import { getInitialRobotState, getRobotStateTimeline } from './commands'
import { getFileMetadata, getRobotType } from './fileFields'
import {
  getLabwareLoadInfo,
  getModulesLoadInfo,
  getPipettesLoadInfo,
} from './utils'

import type {
  Ingredients,
  LabwareEntities,
  PipetteEntities,
  PipetteEntity,
} from '@opentrons/step-generation'
import type { PDPythonFile, PythonDesignerApplication } from '../../file-types'
import type { LabwareDefByDefURI } from '../../labware-defs'

if (isEmpty(_OT_PD_VERSION_)) {
  console.warn('Could not find application version!')
}
const applicationVersion: string = _OT_PD_VERSION_ || ''
// Internal release date: this should never be read programatically,
// it just helps us humans quickly identify what build a user was using
// when we look at saved protocols (without requiring us to trace thru git logs)
const _internalAppBuildDate = _OT_PD_BUILD_DATE_

// A labware definition is considered "in use" and should be included in
// the protocol file if it either...
// 1. is present on the deck in initial deck setup
// 2. OR is a tiprack def assigned to a pipette, even if it's not on the deck
export const getLabwareDefinitionsInUse = (
  labware: LabwareEntities,
  pipettes: PipetteEntities,
  allLabwareDefsByURI: LabwareDefByDefURI
): LabwareDefByDefURI => {
  const labwareDefURIsOnDeck: string[] = Object.keys(labware).map(
    (labwareId: string) => labware[labwareId].labwareDefURI
  )
  const tiprackDefURIsInUse: string[] = Object.keys(pipettes)
    .map(id => pipettes[id])
    .flatMap((pipetteEntity: PipetteEntity) => pipetteEntity.tiprackDefURI)
  const labwareDefURIsInUse = uniq([
    ...tiprackDefURIsInUse,
    ...labwareDefURIsOnDeck,
  ])

  return labwareDefURIsInUse.reduce<LabwareDefByDefURI>(
    (acc, labwareDefURI: string) => ({
      ...acc,
      [labwareDefURI]: allLabwareDefsByURI[labwareDefURI],
    }),
    {}
  )
}

export const createFile = createSelector(
  getFileMetadata,
  getInitialRobotState,
  getRobotStateTimeline,
  getRobotType,
  dismissSelectors.getAllDismissedWarnings,
  ingredSelectors.getLiquidsByLabwareId,
  stepFormSelectors.getSavedStepForms,
  stepFormSelectors.getOrderedStepIds,
  uiLabwareSelectors.getLabwareNicknamesById,
  stepFormSelectors.getInvariantContext,
  (
    fileMetadata,
    robotState,
    robotStateTimeline,
    robotType,
    dismissedWarnings,
    ingredLocations,
    savedStepForms,
    orderedStepIds,
    labwareNicknamesById,
    invariantContext
  ): PDPythonFile => {
    const { pipetteEntities, moduleEntities, labwareEntities, liquidEntities } =
      invariantContext

    const savedOrderedStepIds = orderedStepIds.filter(
      stepId => savedStepForms[stepId]
    )

    const ingredients: Ingredients = Object.fromEntries(
      Object.entries(liquidEntities).map(
        ([liquidId, { pythonName, ...rest }]) => [liquidId, rest]
      )
    )

    const allUniqueLiquidClassesFromForms = Array.from(
      Object.values(savedStepForms).reduce<Set<string>>((acc, stepForm) => {
        if (
          'liquidClass' in stepForm &&
          stepForm.liquidClass != null &&
          stepForm.liquidClass !== NONE_LIQUID_CLASS_NAME
        ) {
          acc.add(stepForm.liquidClass as string)
        }
        return acc
      }, new Set())
    )

    const designerApplication: PythonDesignerApplication = {
      robot: {
        model: robotType,
      },
      designerApplication: {
        name: 'opentrons/protocol-designer',
        // NOTE: hardcoding in the version like this could be tricky since we
        // will have to remember to update the version with every release. But this solves
        // the issues where you have to manually update when importing back to PD, before the release
        // since using `applicationVersion` means that the version is tied to the release tag.
        version: PD_APPLICATION_VERSION,
        data: {
          pipetteTiprackAssignments: mapValues(
            pipetteEntities,
            (
              p: (typeof pipetteEntities)[keyof typeof pipetteEntities]
            ): string[] => p.tiprackDefURI
          ),
          dismissedWarnings,
          ingredients,
          ingredLocations,
          savedStepForms,
          orderedStepIds: savedOrderedStepIds,
          pipettes: getPipettesLoadInfo(pipetteEntities),
          modules: getModulesLoadInfo(moduleEntities),
          labware: getLabwareLoadInfo(labwareEntities, labwareNicknamesById),
        },
      },
      metadata: fileMetadata,
    }

    const pythonProtocol =
      [
        // Here are the sections of the Python file:
        pythonImports(),
        pythonMetadata({
          ...fileMetadata,
          protocolDesigner: applicationVersion,
          internalAppBuildDate: _internalAppBuildDate,
        }),
        pythonRequirements(robotType),
        pythonDefRun(
          invariantContext,
          robotState,
          robotStateTimeline,
          ingredLocations,
          labwareNicknamesById,
          robotType,
          allUniqueLiquidClassesFromForms
        ),
        pythonCustomLabwareDict(invariantContext.labwareEntities),
      ]
        .filter(section => section) // skip any blank sections
        .join('\n\n') + '\n'

    return { pythonProtocol, designerApplication }
  }
)
