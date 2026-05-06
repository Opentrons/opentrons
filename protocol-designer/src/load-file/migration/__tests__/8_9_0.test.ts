import { describe, expect, it } from 'vitest'

import { isBroken890Export, migrateFile } from '../8_9_0'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { FormData } from '/protocol-designer/form-types'

// Alias for clarity. No separate type for this, currently.
type LegacyFormData = FormData

describe('v8.9.0 migration', () => {
  it('should migrate Thermocycler profile steps and leave other steps alone', () => {
    const initialDeckSetupStep: LegacyFormData = {
      labwareLocationUpdate: {},
      moduleLocationUpdate: {},
      pipetteLocationUpdate: {},
      trashBinLocationUpdate: {},
      wasteChuteLocationUpdate: {},
      stagingAreaLocationUpdate: {},
      gripperLocationUpdate: {},
      stepType: 'manualIntervention',
      id: '__INITIAL_DECK_SETUP_STEP__',
    }

    const originalProfileStep: LegacyFormData = {
      id: 'profile-step-id',
      stepName: 'profile step name',
      stepDetails: 'profile step details',

      stepType: 'thermocycler',
      thermocyclerFormType: 'thermocyclerProfile',
      moduleId: 'thermocycler-module-id',

      blockIsActive: false,
      blockTargetTemp: null,
      lidIsActive: false,
      lidTargetTemp: null,
      lidOpen: false,

      orderedProfileItems: [
        '40e2cf7d-112f-4ded-9375-0e225cc776eb',
        'f4aa883f-41e6-42fb-875f-d4adf02fd2c5',
      ],
      profileItemsById: {
        '40e2cf7d-112f-4ded-9375-0e225cc776eb': {
          type: 'profileStep',
          id: '40e2cf7d-112f-4ded-9375-0e225cc776eb',
          title: 'tagmentation',
          temperature: '4',
          durationMinutes: '1',
          durationSeconds: '',
        },
        'f4aa883f-41e6-42fb-875f-d4adf02fd2c5': {
          type: 'profileStep',
          id: 'f4aa883f-41e6-42fb-875f-d4adf02fd2c5',
          title: 'hold',
          temperature: '10',
          durationMinutes: '2',
          durationSeconds: '',
        },
      },
      profileTargetLidTemp: '40',
      profileVolume: '10',

      blockIsActiveHold: true,
      blockTargetTempHold: '123',
      lidIsActiveHold: true,
      lidTargetTempHold: '456',
      lidOpenHold: true,
    }

    const pauseStep: LegacyFormData = {
      moduleId: '23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType',
      pauseAction: 'untilTime',
      pauseMessage: '',
      pauseTemperature: null,
      pauseTime: '0:1:0',
      id: 'pause-step-id',
      stepType: 'pause',
      stepName: 'pause',
      stepDetails: '',
    }

    const setStateStep: LegacyFormData = {
      id: 'set-state-step-id',
      stepName: 'set state step name',
      stepDetails: 'set state step details',

      stepType: 'thermocycler',
      thermocyclerFormType: 'thermocyclerState',

      moduleId: 'thermocycler-module-id',

      blockIsActive: false,
      blockTargetTemp: null,
      lidIsActive: false,
      lidTargetTemp: null,
      lidOpen: true,

      orderedProfileItems: [],
      profileItemsById: {},
      profileTargetLidTemp: null,
      profileVolume: null,

      blockIsActiveHold: false,
      blockTargetTempHold: null,
      lidIsActiveHold: false,
      lidTargetTempHold: null,
      lidOpenHold: null,
    }

    const input = createFile({
      orderedStepIds: [
        // Intentionally omitting initialDeckSetupStep.id.
        originalProfileStep.id,
        pauseStep.id,
        setStateStep.id,
      ],
      savedStepForms: Object.fromEntries(
        [
          initialDeckSetupStep,
          originalProfileStep,
          pauseStep,
          setStateStep,
        ].map(step => [step.id, step])
      ),
      version: '8.8.0',
    })

    const result = migrateFile(input)
    const {
      orderedStepIds: resultOrderedStepIds,
      savedStepForms: resultSavedStepForms,
    } = result.designerApplication!.data!

    expect(resultOrderedStepIds).toStrictEqual([
      // In the step ordering, the original profile command (index 0) should have
      // been replaced by 3 new commands.
      expect.any(String),
      expect.any(String),
      expect.any(String),
      pauseStep.id,
      setStateStep.id,
    ])
    const newProfileStepId = resultOrderedStepIds[0]
    const newWaitForProfileCompleteStepId = resultOrderedStepIds[1]
    const newSetStateStepId = resultOrderedStepIds[2]

    const newProfileStep: FormData = {
      id: newProfileStepId,
      stepName: 'profile step name',
      stepDetails: 'profile step details',

      stepType: 'thermocycler',
      thermocyclerFormType: 'thermocyclerProfile',
      moduleId: 'thermocycler-module-id',

      blockIsActive: false,
      blockTargetTemp: null,
      lidIsActive: false,
      lidTargetTemp: null,
      lidOpen: false,

      orderedProfileItems: [
        '40e2cf7d-112f-4ded-9375-0e225cc776eb',
        'f4aa883f-41e6-42fb-875f-d4adf02fd2c5',
      ],
      profileItemsById: {
        '40e2cf7d-112f-4ded-9375-0e225cc776eb': {
          type: 'profileStep',
          id: '40e2cf7d-112f-4ded-9375-0e225cc776eb',
          title: 'tagmentation',
          temperature: '4',
          durationMinutes: '1',
          durationSeconds: '',
        },
        'f4aa883f-41e6-42fb-875f-d4adf02fd2c5': {
          type: 'profileStep',
          id: 'f4aa883f-41e6-42fb-875f-d4adf02fd2c5',
          title: 'hold',
          temperature: '10',
          durationMinutes: '2',
          durationSeconds: '',
        },
      },
      profileTargetLidTemp: '40',
      profileVolume: '10',
    }

    const newWaitForProfileCompleteStep: FormData = {
      id: newWaitForProfileCompleteStepId,
      stepName: 'pause',
      stepDetails: '',

      stepType: 'pause',
      pauseAction: 'untilThermocyclerProfileComplete',
      moduleId: 'thermocycler-module-id',
    }

    const newSetStateStep: FormData = {
      id: newSetStateStepId,
      stepName: originalProfileStep.stepName,
      stepDetails: originalProfileStep.stepDetails,

      stepType: 'thermocycler',
      thermocyclerFormType: 'thermocyclerState',
      moduleId: 'thermocycler-module-id',

      blockIsActive: true,
      blockTargetTemp: '123',
      lidIsActive: true,
      lidTargetTemp: '456',
      lidOpen: true,

      orderedProfileItems: [],
      profileItemsById: {},
      profileTargetLidTemp: null,
      profileVolume: null,
    }

    expect(resultSavedStepForms).toStrictEqual(
      Object.fromEntries(
        [
          initialDeckSetupStep,
          newProfileStep,
          newWaitForProfileCompleteStep,
          newSetStateStep,
          pauseStep,
          setStateStep,
        ].map(step => [step.id, step])
      )
    )
  })
})

describe('isBroken890Export', () => {
  const v880TCProfile: LegacyFormData = {
    id: 'v880-tc-profile',
    stepType: 'thermocycler',
    stepName: 'profile step name',
    stepDetails: 'profile step details',

    thermocyclerFormType: 'thermocyclerProfile',

    moduleId: 'thermocycler-module-id',

    blockIsActive: false,
    blockTargetTemp: null,
    lidIsActive: false,
    lidTargetTemp: null,
    lidOpen: false,

    orderedProfileItems: [],
    profileItemsById: {},
    profileTargetLidTemp: '40',
    profileVolume: '10',

    blockIsActiveHold: true,
    blockTargetTempHold: '123',
    lidIsActiveHold: true,
    lidTargetTempHold: '456',
    lidOpenHold: true,
  }

  const v890TCProfileStart: FormData = {
    id: 'v890-tc-profile',
    stepType: 'thermocycler',
    stepName: 'profile step name',
    stepDetails: 'profile step details',

    thermocyclerFormType: 'thermocyclerProfile',

    moduleId: 'thermocycler-module-id',

    blockIsActive: false,
    blockTargetTemp: null,
    lidIsActive: false,
    lidTargetTemp: null,
    lidOpen: false,

    orderedProfileItems: [],
    profileItemsById: {},
    profileTargetLidTemp: '40',
    profileVolume: '10',
  }

  const v890TCProfilePause: FormData = {
    id: 'v890-tc-profile-pause',
    stepType: 'pause',
    stepName: 'pause',
    stepDetails: '',

    pauseAction: 'untilThermocyclerProfileComplete',
    moduleId: 'thermocycler-module-id',
  }

  it('should return false for v8.8.0-labeled files with v8.8.0 contents', () => {
    const file = createFile({
      version: '8.8.0',
      orderedStepIds: [v880TCProfile.id],
      savedStepForms: { [v880TCProfile.id]: v880TCProfile },
    })
    expect(isBroken890Export(file)).toStrictEqual(false)
  })

  it('should return true for v8.8.0-labeled files with v8.9.0 contents', () => {
    const file = createFile({
      version: '8.8.0',
      orderedStepIds: [v890TCProfileStart.id, v890TCProfilePause.id],
      savedStepForms: {
        [v890TCProfileStart.id]: v890TCProfileStart,
        [v890TCProfilePause.id]: v890TCProfilePause,
      },
    })
    expect(isBroken890Export(file)).toStrictEqual(true)
  })

  it('should return false for v8.9.0-labeled files with v8.9.0 contents', () => {
    const file = createFile({
      version: '8.9.0',
      orderedStepIds: [v890TCProfileStart.id, v890TCProfilePause.id],
      savedStepForms: {
        [v890TCProfileStart.id]: v890TCProfileStart,
        [v890TCProfilePause.id]: v890TCProfilePause,
      },
    })
    expect(isBroken890Export(file)).toStrictEqual(false)
  })
})

/** Create a mock protocol file with the given commands and version. */
function createFile({
  orderedStepIds,
  savedStepForms,
  version,
}: {
  orderedStepIds: PDMetadata['orderedStepIds']
  savedStepForms: PDMetadata['savedStepForms']
  version: NonNullable<ProtocolFile['designerApplication']>['version']
}): ProtocolFile<PDMetadata> {
  return {
    designerApplication: {
      data: {
        orderedStepIds,
        savedStepForms,
      },
      ...(version != null && { version }),
    },
  } as any
}
