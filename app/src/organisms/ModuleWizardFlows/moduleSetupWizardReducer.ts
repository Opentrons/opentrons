import { ACTIONS } from './constants'
import { getModuleSetupSteps } from './getModuleSetupSteps'

import type { ModuleWizardAction, ModuleWizardState } from './types'

export function moduleSetupWizardReducer(
  state: ModuleWizardState,
  action: ModuleWizardAction
): ModuleWizardState {
  switch (action.type) {
    case ACTIONS.BUILD_FLOW: {
      const stepsInFlow = getModuleSetupSteps(action.attachedModule.moduleType)
      return {
        currentStepIndex: 0,
        currentStep: stepsInFlow[0],
        totalStepCount: stepsInFlow.length - 1,
        stepsInFlow,
        attachedModule: action.attachedModule,
      }
    }
    case ACTIONS.RESTART_FLOW: {
      return {
        currentStepIndex: 0,
        currentStep: null,
        totalStepCount: 0,
        stepsInFlow: [],
        attachedModule: null,
      }
    }
    case ACTIONS.PROCEED: {
      const newStepIndex =
        state.totalStepCount >= state.currentStepIndex + 1
          ? state.currentStepIndex + 1
          : state.currentStepIndex
      return {
        ...state,
        currentStepIndex: newStepIndex,
        currentStep: state.stepsInFlow[newStepIndex],
      }
    }
    case ACTIONS.GO_BACK: {
      const newStepIndex =
        state.currentStepIndex > 0
          ? state.currentStepIndex - 1
          : state.currentStepIndex
      return {
        ...state,
        currentStepIndex: newStepIndex,
        currentStep: state.stepsInFlow[newStepIndex],
      }
    }
    case ACTIONS.PATCH_MODULE: {
      return {
        ...state,
        attachedModule: action.attachedModule,
      }
    }
  }
}
