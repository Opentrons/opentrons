// @flow
// Named arguments to createFile selector. This data would be the result of several selectors.
import type { StepIdType } from '../../../form-types'
import type { ModuleEntities, SavedStepFormState } from '../../../step-forms'
import type { RobotState, Timeline } from '../../../step-generation'

export const initialRobotState: RobotState = {
  labware: {
    trashId: {
      slot: '12',
    },
    tiprackId: {
      slot: '2',
    },
    plateId: {
      slot: 'magneticModuleId',
    },
  },
  modules: {
    magneticModuleId: {
      slot: '1',
      moduleState: {
        type: 'magneticModuleType',
        engaged: true,
      },
    },
  },
  pipettes: {
    pipetteId: {
      mount: 'left',
    },
  },
  liquidState: { labware: {}, pipettes: {} },
  tipState: { tipracks: {}, pipettes: {} },
}

export const robotStateTimeline: Timeline = {
  timeline: [
    {
      commands: [
        {
          command: 'magneticModule/engageMagnet',
          params: {
            module: 'magneticModuleId',
            engageHeight: 16,
          },
        },
      ],
      robotState: initialRobotState,
    },
  ],
  errors: null,
}

export const savedStepForms: SavedStepFormState = {
  __INITIAL_DECK_SETUP_STEP__: {
    stepType: 'manualIntervention',
    id: '__INITIAL_DECK_SETUP_STEP__',
    labwareLocationUpdate: {
      trashId: '12',
      tiprackId: '2',
      plateId: 'magneticModuleId',
    },
    pipetteLocationUpdate: {
      pipetteId: 'left',
    },
    moduleLocationUpdate: {
      magneticModuleId: '1',
    },
  },
  engageMagnetStepId: {
    id: 'engageMagnetStepId',
    stepType: 'magnet',
    stepName: 'magnet',
    stepDetails: '',
    moduleId: 'magneticModuleId',
    magnetAction: 'engage',
    engageHeight: '16',
  },
}

export const orderedStepIds: Array<StepIdType> = ['engageMagnetStepId']

export const moduleEntities: ModuleEntities = {
  magneticModuleId: {
    id: 'magneticModuleId',
    type: 'magneticModuleType',
    model: 'magneticModuleV1',
  },
}
