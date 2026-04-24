import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { INITIAL_DECK_SETUP_STEP_ID, PAUSE_UNTIL_TEMP } from '../../constants'
import { moveDeckItem } from '../../labware-ingred/actions'
import { handleFormChange } from '../../steplist/formLevel/handleFormChange'
import { PRESAVED_STEP_ID } from '../../steplist/types'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import {
  batchEditFormChanges,
  labwareInvariantProperties,
  moduleInvariantProperties,
  orderedStepIds,
  presavedStepForm,
  savedStepForms,
  unsavedForm,
} from '../reducers'
import {
  _getInitialDeckSetupRootState,
  _getLabwareEntitiesRootState,
  _getPipetteEntitiesRootState,
} from '../selectors'
import { createPresavedStepForm } from '../utils/createPresavedStepForm'

import type { ModuleEntity } from '@opentrons/step-generation'
import type { SaveStepFormAction } from '/protocol-designer/ui/steps/actions/thunks'
import type { FormData, StepType } from '../../form-types'
import type { DeleteContainerAction } from '../../labware-ingred/actions/actions'
import type {
  ChangeFormInputAction,
  DeleteMultipleStepsAction,
} from '../../steplist/actions'
import type { DeckSlot } from '../../types'
import type {
  AddStepAction,
  DuplicateSelectedStepsAction,
  SelectMultipleStepsAction,
  SelectStepAction,
  SelectTerminalItemAction,
} from '../../ui/steps'
import type {
  ChangeBatchEditFieldAction,
  ResetBatchEditFieldChangesAction,
  SaveStepFormsMultiAction,
} from '../actions'
import type { CreateModuleAction, DeleteModuleAction } from '../actions/modules'
import type {
  DeletePipettesAction,
  SubstituteStepFormPipettesAction,
} from '../actions/pipettes'
import type {
  PresavedStepFormAction,
  PresavedStepFormState,
  RootState,
  SavedStepFormsActions,
  UnsavedFormActions,
} from '../reducers'

vi.mock('../../labware-defs/utils')
vi.mock('../selectors')
vi.mock('../../steplist/formLevel/handleFormChange')
vi.mock('../utils/createPresavedStepForm')
vi.mock('../../utils/labwareModuleCompatibility')
vi.mock('../../utils')

afterEach(() => {
  vi.clearAllMocks()
})
describe('orderedStepIds reducer', () => {
  it('should add a saved step when that step is new', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['99'],
      savedStepForms: {
        '99': {
          id: '99',
          stepType: 'moveLiquid',
        },
      },
    }
    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: '123',
          stepType: 'moveLiquid',
        },
        concurrentGroupPauseStepId: 'concurrentGroupPauseStepId',
      },
    }
    expect(orderedStepIds(state as RootState, action)).toEqual(['99', '123'])
  })
  it('should not update when an existing step is saved', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['99', '123', '11'],
      savedStepForms: {
        '99': {
          id: '99',
          stepType: 'moveLiquid',
        },
        '123': {
          id: '123',
          stepType: 'moveLiquid',
        },
        '11': {
          id: '11',
          stepType: 'moveLiquid',
        },
      },
    }
    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: '123',
          stepType: 'moveLiquid',
        },
        concurrentGroupPauseStepId: 'concurrentGroupPauseStepId',
      },
    }
    expect(orderedStepIds(state as RootState, action)).toBe(
      state.orderedStepIds
    )
  })
  it('should also add a pause step when a new thermocycler profile step is created', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['id-1'],
      savedStepForms: {
        'id-1': {
          id: 'id-1',
          stepType: 'moveLiquid',
        },
      },
    }
    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: 'id-2',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerProfile',
          moduleId: 'thermocyclerModuleId',
        },
        concurrentGroupPauseStepId: 'id-3',
      },
    }
    const expectedOrder = ['id-1', 'id-2', 'id-3']
    expect(orderedStepIds(state as RootState, action)).toEqual(expectedOrder)
  })
  it('should create a pause step when a non-TC-profile step is edited to become a TC profile step', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['1', '2', '3'],
      savedStepForms: {
        '1': {
          id: '1',
          stepType: 'moveLiquid',
        },
        '2': {
          id: '2',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerState',
          moduleId: 'thermocyclerModuleId',
        },
        '3': {
          id: '3',
          stepType: 'moveLiquid',
        },
      },
    }

    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: '2',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerProfile',
          moduleId: 'thermocyclerModuleId',
        },
        concurrentGroupPauseStepId: 'pause-for-2',
      },
    }

    expect(orderedStepIds(state as RootState, action)).toEqual([
      '1',
      '2',
      'pause-for-2',
      '3',
    ])
  })
  it('should handle a non-TC-profile, which is inside a TC profile, being edited to also become a TC profile', () => {
    // Since we can't allow TC profiles to nest, the edited step should get moved
    // so it's outside the profile that was enclosing it.
    const state: Partial<RootState> = {
      orderedStepIds: [
        '1',
        '2-begin-profile',
        '3',
        '4',
        '5',
        '6-pause-for-2',
        '7',
      ],
      savedStepForms: {
        '1': { id: '1', stepType: 'moveLiquid' },
        '2-begin-profile': {
          id: '2-begin-profile',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerProfile',
          moduleId: 'thermocyclerModuleId',
        },
        '3': { id: '3', stepType: 'moveLiquid' },
        '4': {
          id: '4',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerState',
          moduleId: 'thermocyclerModuleId',
        },
        '5': { id: '5', stepType: 'moveLiquid' },
        '6-pause-for-2': {
          id: '6-pause-for-2',
          stepType: 'pause',
          pauseAction: 'untilThermocyclerProfileComplete',
          moduleId: 'thermocyclerModuleId',
        },
        '7': { id: '7', stepType: 'moveLiquid' },
      },
    }

    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: '4',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerProfile',
          moduleId: 'thermocyclerModuleId',
        },
        concurrentGroupPauseStepId: 'pause-for-4',
      },
    }

    expect(orderedStepIds(state as RootState, action)).toEqual([
      '1',
      '2-begin-profile',
      '3',
      '5',
      '6-pause-for-2',
      '4',
      'pause-for-4',
      '7', // Non-TC step
    ])
  })
  it('should delete the paired pause step when a TC profile step is edited to become a non-TC-profile step', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['1', '2', '3', 'pause-for-2', '4'],
      savedStepForms: {
        '1': { id: '1', stepType: 'moveLiquid' },
        '2': {
          id: '2',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerProfile',
          moduleId: 'thermocyclerModuleId',
        },
        '3': { id: '3', stepType: 'moveLiquid' },
        'pause-for-2': {
          id: 'pause-for-2',
          stepType: 'pause',
          pauseAction: 'untilThermocyclerProfileComplete',
          moduleId: 'thermocyclerModuleId',
        },
        '4': { id: '4', stepType: 'moveLiquid' },
      },
    }

    const action: SaveStepFormAction = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: {
          id: '2',
          stepType: 'thermocycler',
          thermocyclerFormType: 'thermocyclerState',
          moduleId: 'thermocyclerModuleId',
        },
        concurrentGroupPauseStepId: 'unused-thermocycler-pause-step-id',
      },
    }

    expect(orderedStepIds(state as RootState, action)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])
  })
  it('should remove multiple saved steps when multiple steps are deleted', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['1', '2', '3'],
      savedStepForms: {},
    }
    const action: DeleteMultipleStepsAction = {
      type: 'DELETE_MULTIPLE_STEPS',
      payload: ['1', '3'],
    }
    expect(orderedStepIds(state as RootState, action)).toEqual(['2'])
  })
  it('should set the new step order when steps are duplicated', () => {
    const state: Partial<RootState> = {
      orderedStepIds: ['1', '2', '3'],
      savedStepForms: {},
    }
    const action: DuplicateSelectedStepsAction = {
      type: 'DUPLICATE_SELECTED_STEPS',
      payload: {
        steps: [
          {
            originalStepId: '1',
            duplicateStepId: 'dup_1',
          },
        ],
        newStepOrder: ['1', 'dup_1', '2', '3'],
      },
    }
    expect(orderedStepIds(state as RootState, action)).toEqual([
      '1',
      'dup_1',
      '2',
      '3',
    ])
  })
})
describe('labwareInvariantProperties reducer', () => {
  it('replace custom labware def', () => {
    const prevState = {
      labwareIdA1: {
        labwareDefURI: 'foo/a/1',
        pythonName: 'mockPythonName',
        displayCategory: 'wellPlate',
      },
      labwareIdA2: {
        labwareDefURI: 'foo/a/1',
        pythonName: 'mockPythonName',
        displayCategory: 'wellPlate',
      },
      labwareIdB: {
        labwareDefURI: 'foo/b/1',
        pythonName: 'mockPythonName',
        displayCategory: 'wellPlate',
      },
    }
    const result = labwareInvariantProperties(prevState, {
      type: 'REPLACE_CUSTOM_LABWARE_DEF',
      payload: {
        defURIToOverwrite: 'foo/a/1',
        newDef: {
          parameters: {
            loadName: 'a',
          },
          version: 2,
          namespace: 'foo',
          metadata: {
            displayCategory: 'wellPlate',
          },
        },
        isOverwriteMismatched: false,
      },
    })
    expect(result).toEqual({
      // changed
      labwareIdA1: {
        labwareDefURI: 'foo/a/2',
        displayCategory: 'wellPlate',
      },
      labwareIdA2: {
        labwareDefURI: 'foo/a/2',
        displayCategory: 'wellPlate',
      },
      // unchanged
      labwareIdB: {
        labwareDefURI: 'foo/b/1',
        displayCategory: 'wellPlate',
        pythonName: 'mockPythonName',
      },
    })
  })
})

describe('moduleInvariantProperties reducer', () => {
  let prevState: Record<string, ModuleEntity>
  const existingModuleId = 'existingModuleId'
  const newId = 'newModuleId'
  beforeEach(() => {
    prevState = {
      [existingModuleId]: {
        id: existingModuleId,
        slot: '1',
        type: MAGNETIC_MODULE_TYPE,
        // @ts-expect-error(sa, 2021-6-14): not a valid magnetic module model
        model: 'someMagModel',
      },
    }
  })
  it('create module', () => {
    const newModuleData = {
      id: newId,
      slot: '3',
      type: TEMPERATURE_MODULE_TYPE,
      model: 'someTempModel',
    }
    const result = moduleInvariantProperties(prevState, {
      type: 'CREATE_MODULE',
      payload: newModuleData,
    })
    expect(result).toEqual({
      ...prevState,
      [newId]: {
        id: newId,
        type: newModuleData.type,
        model: newModuleData.model,
      },
    })
  })
  it('delete module', () => {
    const result = moduleInvariantProperties(prevState, {
      type: 'DELETE_MODULE',
      payload: {
        id: existingModuleId,
      },
    })
    expect(result).toEqual({})
  })
})
interface MakeDeckSetupStepArgs {
  labwareLocationUpdate?: Record<string, DeckSlot>
  pipetteLocationUpdate?: Record<string, DeckSlot>
  moduleLocationUpdate?: Record<string, DeckSlot>
}

const makeDeckSetupStep = (args: MakeDeckSetupStepArgs = {}): any => ({
  stepType: 'manualIntervention',
  id: '__INITIAL_DECK_SETUP_STEP__',
  labwareLocationUpdate: args.labwareLocationUpdate || {},
  pipetteLocationUpdate: args.pipetteLocationUpdate || {},
  moduleLocationUpdate: args.moduleLocationUpdate || {},
})

const makePrevRootState = (args?: MakeDeckSetupStepArgs): any => ({
  savedStepForms: {
    [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep(args),
  },
})

describe('savedStepForms reducer: initial deck setup step', () => {
  const existingLabwareId = '_existingLabwareId'
  const otherLabwareId = '_otherLabwareId'
  const newLabwareId = '_newLabwareId'
  const moduleId = '_moduleId'
  const otherModuleId = '_otherModuleId'
  const labwareOnModuleId = '_labwareOnModuleId'
  describe('create (or duplicate) new labware', () => {
    const newSlot = '8'
    const testCases: Array<{
      testName: string
      action: SavedStepFormsActions
    }> = [
      {
        testName: 'duplicate labware',
        action: {
          type: 'DUPLICATE_LABWARE',
          payload: {
            templateLabwareId: existingLabwareId,
            duplicateLabwareId: newLabwareId,
            duplicateLabwareNickname: 'new labware nickname',
            slot: newSlot,
            displayCategory: 'wellPlate',
          },
        },
      },
      {
        testName: `create labware in slot ${newSlot}`,
        action: {
          type: 'CREATE_CONTAINER',
          payload: {
            slot: newSlot,
            labwareDefURI: 'fixtures/foo/1',
            id: newLabwareId,
            displayCategory: 'adapter',
          },
        },
      },
    ]
    testCases.forEach(({ testName, action }) => {
      it(testName, () => {
        const prevRootState = makePrevRootState({
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
        })
        const result = savedStepForms(prevRootState, action)
        expect(
          result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
        ).toEqual({
          [existingLabwareId]: '1',
          [newLabwareId]: newSlot,
        })
      })
    })
  })
  describe('move deck item', () => {
    const testCases: Array<{
      testName: string
      sourceSlot: DeckSlot
      destSlot: DeckSlot
      makeStateArgs: MakeDeckSetupStepArgs
      deckSetup?: any
      labwareIsCompatible?: boolean
      expectedLabwareLocations?: Record<string, any>
      expectedModuleLocations?: Record<string, any>
    }> = [
      {
        testName: 'move labware to empty slot -> simple move',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: '3',
        },
      },
      {
        testName: 'move labware to slot with labware -> swap labware',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
            [otherLabwareId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: '3',
          [otherLabwareId]: '1',
        },
      },
      {
        testName: 'move labware empty module -> labware added to module',
        sourceSlot: '1',
        destSlot: moduleId,
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        // NOTE: if labware is incompatible, it's up to the UI to block this.
        testName:
          'move labware to slot with occupied module -> swap labware, module stays',
        sourceSlot: '1',
        destSlot: moduleId,
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: moduleId,
          [labwareOnModuleId]: '1',
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName: 'move empty module to empty slot -> simple move',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {},
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName:
          'move empty module to slot with incompatible labware -> swap slots, do not add labware to module',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '3',
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: {
                foo: 'fake def',
              },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: false,
        expectedLabwareLocations: {
          [existingLabwareId]: '1',
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName:
          'move empty module to slot with compatible labware -> put module under labware',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '3',
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: {
                foo: 'fake def',
              },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: true,
        expectedLabwareLocations: {
          [existingLabwareId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName:
          'move occupied module to slot with labware -> swap slots, do not change labware on module (even if compatible)',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '3',
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: {
                foo: 'fake def',
              },
            },
            [labwareOnModuleId]: {
              id: labwareOnModuleId,
              slot: moduleId,
              def: {
                foo: 'fake def',
              },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: true,
        expectedLabwareLocations: {
          [existingLabwareId]: '1',
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName: 'move labware off of module to empty slot',
        sourceSlot: moduleId,
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: '3',
        },
        expectedModuleLocations: {
          [moduleId]: '1',
        },
      },
      {
        testName: 'move empty module to occupied module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'empty module to empty module -> swap',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {},
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'occupied module to occupied module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
            [otherLabwareId]: otherModuleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
          [otherLabwareId]: otherModuleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'occupied module to empty module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
    ]
    testCases.forEach(
      ({
        testName,
        sourceSlot,
        destSlot,
        makeStateArgs,
        deckSetup,
        labwareIsCompatible,
        expectedLabwareLocations,
        expectedModuleLocations,
      }) => {
        it(testName, () => {
          vi.mocked(_getInitialDeckSetupRootState).mockReturnValue(deckSetup)
          vi.mocked(getLabwareIsCompatible).mockReturnValue(
            labwareIsCompatible!
          )
          const prevRootState = makePrevRootState(makeStateArgs)
          const action = moveDeckItem(sourceSlot, destSlot)
          const result = savedStepForms(prevRootState, action)

          if (expectedLabwareLocations != null) {
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
            ).toEqual(expectedLabwareLocations)
          }

          if (expectedModuleLocations != null) {
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
            ).toEqual(expectedModuleLocations)
          }
        })
      }
    )
  })
  it('delete labware -> removes labware from initial deck setup step', () => {
    const labwareToDeleteId = '__labwareToDelete'
    const prevRootState = makePrevRootState({
      labwareLocationUpdate: {
        [existingLabwareId]: '1',
        [labwareToDeleteId]: '2',
      },
    })
    const action: DeleteContainerAction = {
      type: 'DELETE_CONTAINER',
      payload: {
        labwareId: labwareToDeleteId,
      },
    }
    const result = savedStepForms(prevRootState, action)
    expect(result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate).toEqual({
      [existingLabwareId]: '1',
    })
  })
  it('delete pipettes -> removes pipette(s) from initial deck setup step', () => {
    const leftPipetteId = '__leftPipette'
    const rightPipetteId = '__rightPipette'
    const prevRootState = makePrevRootState({
      pipetteLocationUpdate: {
        [leftPipetteId]: 'left',
        [rightPipetteId]: 'right',
      },
    })
    const testCases = [
      {
        pipettesToDelete: [leftPipetteId],
        expected: {
          [rightPipetteId]: 'right',
        },
      },
      {
        pipettesToDelete: [leftPipetteId, rightPipetteId],
        expected: {},
      },
    ]
    testCases.forEach(({ pipettesToDelete, expected }) => {
      const action: DeletePipettesAction = {
        type: 'DELETE_PIPETTES',
        payload: pipettesToDelete,
      }
      const result = savedStepForms(prevRootState, action)
      expect(result[INITIAL_DECK_SETUP_STEP_ID].pipetteLocationUpdate).toEqual(
        expected
      )
    })
  })
  describe('create module', () => {
    describe('NO existing steps', () => {
      const destSlot = '3'
      const testCases = [
        {
          testName:
            'create module in empty deck slot (labware in unrelated slot unaffected)',
          makeStateArgs: {
            labwareLocationUpdate: {
              [existingLabwareId]: '6',
            },
          },
          expectedLabwareLocations: {
            [existingLabwareId]: '6',
          },
          expectedModuleLocations: {
            [moduleId]: destSlot,
          },
        },
        {
          testName:
            'create module in deck slot occupied with labware -> move that labware to the new module',
          makeStateArgs: {
            labwareLocationUpdate: {
              [existingLabwareId]: destSlot,
            },
          },
          expectedLabwareLocations: {
            [existingLabwareId]: moduleId,
          },
          expectedModuleLocations: {
            [moduleId]: destSlot,
          },
        },
      ]
      testCases.forEach(
        ({
          testName,
          makeStateArgs,
          expectedLabwareLocations,
          expectedModuleLocations,
        }) => {
          it(testName, () => {
            const action: CreateModuleAction = {
              type: 'CREATE_MODULE',
              payload: {
                id: moduleId,
                slot: destSlot,
                type: TEMPERATURE_MODULE_TYPE,
                // @ts-expect-error(sa, 2021-6-14): not a valid module model
                model: 'someTempModel',
              },
            }
            const prevRootState = makePrevRootState(makeStateArgs)
            const result = savedStepForms(prevRootState, action)
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
            ).toEqual(expectedLabwareLocations)
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
            ).toEqual(expectedModuleLocations)
          })
        }
      )
    })
    describe('existing steps', () => {
      let prevRootStateWithMagAndTCSteps: any
      beforeEach(() => {
        prevRootStateWithMagAndTCSteps = {
          savedStepForms: {
            ...makePrevRootState().savedStepForms,
            ...{
              mag_step_form_id: {
                stepType: 'magnet',
                moduleId: 'magdeckId',
              },
            },
            ...{
              TC_step_form_id: {
                stepType: 'thermocycler',
                moduleId: 'TCId',
              },
            },
          },
        }
      })
      const magneticStepCases: Array<{
        testName: string
        action: SavedStepFormsActions
        expectedModuleId: string
      }> = [
        {
          testName: 'create mag mod -> override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'newMagdeckId',
              slot: '1',
              type: MAGNETIC_MODULE_TYPE,
              model: 'magneticModuleV1',
            },
          },
          expectedModuleId: 'newMagdeckId',
        },
        {
          testName: 'create temp mod -> DO NOT override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'tempdeckId',
              slot: '1',
              type: TEMPERATURE_MODULE_TYPE,
              model: 'temperatureModuleV1',
            },
          },
          expectedModuleId: 'magdeckId',
        },
        {
          testName: 'create TC -> DO NOT override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'ThermocyclerId',
              slot: '1',
              type: THERMOCYCLER_MODULE_TYPE,
              model: 'thermocyclerModuleV1',
            },
          },
          expectedModuleId: 'magdeckId',
        },
      ]
      const TCStepCases: Array<{
        testName: string
        action: SavedStepFormsActions
        expectedModuleId: string
      }> = [
        {
          testName: 'create temp mod -> DO NOT override TC step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'tempdeckId',
              slot: '1',
              type: TEMPERATURE_MODULE_TYPE,
              model: 'temperatureModuleV1',
            },
          },
          expectedModuleId: 'TCId',
        },
        {
          testName: 'create magnetic mod -> DO NOT override TC step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'newMagdeckId',
              slot: '1',
              type: MAGNETIC_MODULE_TYPE,
              model: 'magneticModuleV2',
            },
          },
          expectedModuleId: 'TCId',
        },
      ]
      magneticStepCases.forEach(({ testName, action, expectedModuleId }) => {
        it(testName, () => {
          const result = savedStepForms(prevRootStateWithMagAndTCSteps, action)
          // @ts-expect-error(sa, 2021-6-14): null check
          if (action.payload.type) {
            expect(result.mag_step_form_id.moduleId).toBe(expectedModuleId)
          }
        })
      })
      TCStepCases.forEach(({ testName, action, expectedModuleId }) => {
        it(testName, () => {
          const result = savedStepForms(prevRootStateWithMagAndTCSteps, action)
          // @ts-expect-error(sa, 2021-6-14): null check
          if (action.payload.type) {
            expect(result.TC_step_form_id.moduleId).toBe(expectedModuleId)
          }
        })
      })
    })
  })
  describe('delete module -> removes module from initial deck setup step', () => {
    const testCases: Array<{
      testName: string
      makeStateArgs: MakeDeckSetupStepArgs
      expectedLabwareLocations?: Record<string, any>
      expectedModuleLocations?: Record<string, any>
    }> = [
      {
        testName: 'delete unoccupied module',
        makeStateArgs: {
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: {
          [otherModuleId]: '2',
        },
      },
      {
        testName: 'delete occupied module -> labware goes into its slot',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: '3',
        },
        expectedModuleLocations: {},
      },
    ]
    testCases.forEach(
      ({
        testName,
        makeStateArgs,
        expectedLabwareLocations,
        expectedModuleLocations,
      }) => {
        it(testName, () => {
          const action: DeleteModuleAction = {
            type: 'DELETE_MODULE',
            payload: {
              id: moduleId,
            },
          }
          const prevRootState = makePrevRootState(makeStateArgs)
          const result = savedStepForms(prevRootState, action)
          expect(
            result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
          ).toEqual(expectedModuleLocations)
          expect(
            result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
          ).toEqual(expectedLabwareLocations)
        })
      }
    )
  })
  describe('delete module -> removes references to module from step forms', () => {
    const stepId = '_stepId'
    const action: DeleteModuleAction = {
      type: 'DELETE_MODULE',
      payload: {
        id: moduleId,
      },
    }

    const getPrevRootStateWithStep = (
      step: FormData
      // @ts-expect-error(sa, 2021-6-14): make this actually return RootState (add the rest of the state properties)
    ): RootState => ({
      savedStepForms: {
        [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep({
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        }),
        [stepId]: step,
      },
    })

    const testCases: Array<{ testName: string; step: FormData }> = [
      {
        testName: 'pause -> wait until temperature step',
        step: {
          id: stepId,
          stepType: 'pause',
          stepName: 'pause until 4C',
          stepDetails: 'some details',
          pauseAction: PAUSE_UNTIL_TEMP,
          pauseHour: null,
          pauseMinute: null,
          pauseSecond: null,
          pauseMessage: '',
          moduleId,
          pauseTemperature: '4',
        },
      },
      {
        testName: 'set temperature step',
        step: {
          id: stepId,
          stepType: 'temperature',
          stepName: 'temperature to 4',
          stepDetails: 'some details',
          moduleId,
          setTemperature: 'true',
          targetTemperature: '4',
        },
      },
      {
        testName: 'magnet step',
        step: {
          id: stepId,
          stepType: 'magnet',
          stepName: 'engage magnet',
          stepDetails: 'some details',
          moduleId,
          magnetAction: 'engage',
          engageHeight: '4',
        },
      },
      {
        testName: 'vacuum step',
        step: {
          id: stepId,
          stepType: 'vacuum',
          moduleId,
        },
      },
    ]
    testCases.forEach(({ testName, step }) => {
      it(testName, () => {
        const result = savedStepForms(getPrevRootStateWithStep(step), action)
        expect(result[stepId]).toEqual({ ...step, moduleId: null })
      })
    })
  })
  describe('deleting steps', () => {
    let savedStepFormsState: {
      [id: string]: {
        stepType: StepType
        id: string
      }
    }
    beforeEach(() => {
      savedStepFormsState = {
        [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep({
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        }),
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id1: {
          id: 'id1',
        },
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id2: {
          id: 'id2',
        },
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id3: {
          id: 'id3',
        },
      }
    })
    it('should delete multiple steps', () => {
      const action = {
        type: 'DELETE_MULTIPLE_STEPS',
        payload: ['id1', 'id2'],
      }
      const expectedState = { ...savedStepFormsState }
      delete expectedState.id1
      delete expectedState.id2
      expect(
        savedStepForms(
          // @ts-expect-error(sa, 2021-6-14): add missing keys to savedStepFormsState
          {
            savedStepForms: savedStepFormsState,
          },
          action
        )
      ).toEqual(expectedState)
    })
  })
  describe('duplicating steps', () => {
    let savedStepFormsState: {
      [id: string]: {
        stepType: StepType
        id: string
      }
    }
    beforeEach(() => {
      savedStepFormsState = {
        [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep({
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        }),
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id1: {
          id: 'id1',
        },
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id2: {
          id: 'id2',
        },
        // @ts-expect-error(sa, 2021-6-14): add stepTypes to these test fixtures
        id3: {
          id: 'id3',
        },
      }
    })
    it('should duplicate steps', () => {
      const action = {
        type: 'DUPLICATE_SELECTED_STEPS',
        payload: {
          steps: [
            {
              stepId: 'id1',
              duplicateStepId: 'dup_1',
            },
            {
              stepId: 'id2',
              duplicateStepId: 'dup_2',
            },
            {
              stepId: 'id3',
              duplicateStepId: 'dup_3',
            },
          ],
          indexToInsert: 0, // this does not matter for this reducer
        },
      }
      const expectedState = {
        ...savedStepFormsState,
        dup_1: {
          id: 'dup_1',
        },
        dup_2: {
          id: 'dup_2',
        },
        dup_3: {
          id: 'dup_3',
        },
      }
      expect(
        savedStepForms(
          // @ts-expect-error(sa, 2021-6-14): add missing keys to savedStepFormsState
          {
            savedStepForms: savedStepFormsState,
          },
          action
        )
      ).toEqual(expectedState)
    })
  })
  describe('saving multiple steps', () => {
    it('should apply the form patch to all of the step ids', () => {
      const prevState: RootState = {
        savedStepForms: {
          // @ts-expect-error(sa, 2021-6-14): add id to fixture
          some_transfer_step_id: {
            stepType: 'moveLiquid',
            blowout_location: 'someLocation',
            dispense_mix_checkbox: true,
            dispense_mix_volume: '10',
          },
          // @ts-expect-error(sa, 2021-6-14): add id to fixture
          another_transfer_step_id: {
            stepType: 'moveLiquid',
            blowout_location: 'anotherLocation',
            dispense_mix_checkbox: true,
            dispense_mix_volume: '20',
          },
        },
      }
      const action: SaveStepFormsMultiAction = {
        type: 'SAVE_STEP_FORMS_MULTI',
        payload: {
          editedFields: {
            blowout_location: 'newLocation',
            dispense_mix_volume: '30',
          },
          stepIds: ['some_transfer_step_id', 'another_transfer_step_id'],
        },
      }
      const expectedSavedStepFormState = {
        some_transfer_step_id: {
          stepType: 'moveLiquid',
          blowout_location: 'newLocation',
          dispense_mix_checkbox: true,
          dispense_mix_volume: '30',
        },
        another_transfer_step_id: {
          stepType: 'moveLiquid',
          blowout_location: 'newLocation',
          dispense_mix_checkbox: true,
          dispense_mix_volume: '30',
        },
      }
      expect(savedStepForms(prevState, action)).toEqual(
        expectedSavedStepFormState
      )
    })
  })
  describe('thermocycler profile pause step handling', () => {
    it('should also add a pause step when a thermocycler profile step is created from scratch', () => {
      const otherForm: FormData = {
        id: 'otherFormId',
        stepType: 'moveLiquid',
      }
      const tcProfileForm: FormData = {
        id: 'tcProfileFormId',
        stepType: 'thermocycler',
        thermocyclerFormType: 'thermocyclerProfile',
        moduleId: 'thermocyclerModuleId',
      }
      const state: Partial<RootState> = {
        orderedStepIds: [otherForm.id],
        savedStepForms: {
          [otherForm.id]: otherForm,
        },
      }

      const pauseStepFormId = 'pauseFormId'
      const expectedPauseStepForm: FormData = {
        id: pauseStepFormId,
        stepType: 'pause',
        stepName: 'pause',
        stepDetails: '',
        pauseAction: 'untilThermocyclerProfileComplete',
        moduleId: tcProfileForm.moduleId,
      }

      const action: SaveStepFormAction = {
        type: 'SAVE_STEP_FORM',
        payload: {
          form: tcProfileForm,
          concurrentGroupPauseStepId: pauseStepFormId,
        },
      }

      const expectedSavedStepForms = {
        [otherForm.id]: otherForm,
        [tcProfileForm.id]: tcProfileForm,
        [expectedPauseStepForm.id]: expectedPauseStepForm,
      }

      expect(savedStepForms(state as RootState, action)).toEqual(
        expectedSavedStepForms
      )
    })
    it('should create a pause step when a non-TC-profile step is edited to become a TC profile step', () => {
      const form1: FormData = {
        id: '1',
        stepType: 'moveLiquid',
      }
      const form2ThermocyclerState: FormData = {
        id: '2',
        stepType: 'thermocycler',
        thermocyclerFormType: 'thermocyclerState',
        moduleId: 'thermocyclerModuleId',
      }
      const form3: FormData = {
        id: '3',
        stepType: 'moveLiquid',
      }
      const state: Partial<RootState> = {
        orderedStepIds: [form1.id, form2ThermocyclerState.id, form3.id],
        savedStepForms: {
          [form1.id]: form1,
          [form2ThermocyclerState.id]: form2ThermocyclerState,
          [form3.id]: form3,
        },
      }

      const form2ThermocyclerProfile: FormData = {
        id: '2',
        stepType: 'thermocycler',
        thermocyclerFormType: 'thermocyclerProfile',
        moduleId: 'thermocyclerModuleId',
      }

      const pauseFormId = 'pauseFormId'
      const expectedPauseForm: FormData = {
        id: pauseFormId,
        stepType: 'pause',
        stepName: 'pause',
        stepDetails: '',
        pauseAction: 'untilThermocyclerProfileComplete',
        moduleId: 'thermocyclerModuleId',
      }

      const action: SaveStepFormAction = {
        type: 'SAVE_STEP_FORM',
        payload: {
          form: form2ThermocyclerProfile,
          concurrentGroupPauseStepId: pauseFormId,
        },
      }

      const expectedSavedStepForms = {
        [form1.id]: form1,
        [form2ThermocyclerProfile.id]: form2ThermocyclerProfile,
        [expectedPauseForm.id]: expectedPauseForm,
        [form3.id]: form3,
      }

      expect(savedStepForms(state as RootState, action)).toEqual(
        expectedSavedStepForms
      )
    })
    it('should delete the paired pause step when a TC profile step is edited to become a non-TC-profile step', () => {
      const form1: FormData = { id: '1', stepType: 'moveLiquid' }
      const form2ThermocyclerState: FormData = {
        id: '2',
        stepType: 'thermocycler',
        thermocyclerFormType: 'thermocyclerState',
        moduleId: 'thermocyclerModuleId',
      }
      const form2ThermocyclerProfile: FormData = {
        id: '2',
        stepType: 'thermocycler',
        thermocyclerFormType: 'thermocyclerProfile',
        moduleId: 'thermocyclerModuleId',
      }
      const pauseForm: FormData = {
        id: 'pause-for-2',
        stepType: 'pause',
        pauseAction: 'untilThermocyclerProfileComplete',
        moduleId: 'thermocyclerModuleId',
      }
      const form3: FormData = { id: '3', stepType: 'moveLiquid' }
      const form4: FormData = { id: '4', stepType: 'moveLiquid' }

      const state: Partial<RootState> = {
        orderedStepIds: [
          form1.id,
          form2ThermocyclerProfile.id,
          form3.id,
          pauseForm.id,
          form4.id,
        ],
        savedStepForms: {
          [form1.id]: form1,
          [form2ThermocyclerProfile.id]: form2ThermocyclerProfile,
          [form3.id]: form3,
          [pauseForm.id]: pauseForm,
          [form4.id]: form4,
        },
      }

      const action: SaveStepFormAction = {
        type: 'SAVE_STEP_FORM',
        payload: {
          form: form2ThermocyclerState,
          concurrentGroupPauseStepId: 'unused-thermocycler-pause-step-id',
        },
      }

      const expectedSavedStepForms = {
        [form1.id]: form1,
        [form2ThermocyclerState.id]: form2ThermocyclerState,
        [form3.id]: form3,
        [form4.id]: form4,
      }

      expect(savedStepForms(state as RootState, action)).toEqual(
        expectedSavedStepForms
      )
    })
  })
})
describe('unsavedForm reducer', () => {
  const someState: any = {
    unsavedForm: 'foo',
  }
  it('should take on the payload of the POPULATE_FORM action', () => {
    const payload = {
      formStuff: 'example',
    }
    const result = unsavedForm(someState, {
      type: 'POPULATE_FORM',
      // @ts-expect-error(sa, 2021-6-14): not a valid FormData payload
      payload,
    })
    expect(result).toEqual(payload)
  })
  it('should use handleFormChange to update the state with CHANGE_FORM_INPUT action', () => {
    const rootState: any = {
      unsavedForm: {
        existingField: 123,
      },
    }
    const action: ChangeFormInputAction = {
      type: 'CHANGE_FORM_INPUT',
      payload: {
        update: {
          someField: -1,
        },
      },
    }
    vi.mocked(handleFormChange).mockReturnValue({
      someField: 42,
    })
    vi.mocked(_getPipetteEntitiesRootState).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not a valid PipetteEntities Type
      'pipetteEntitiesPlaceholder'
    )
    vi.mocked(_getLabwareEntitiesRootState).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not a valid LabwareEntities Type
      'labwareEntitiesPlaceholder'
    )
    const result = unsavedForm(rootState, action)
    expect(vi.mocked(_getPipetteEntitiesRootState).mock.calls).toEqual([
      [rootState],
    ])
    expect(vi.mocked(_getLabwareEntitiesRootState).mock.calls).toEqual([
      [rootState],
    ])
    expect(vi.mocked(handleFormChange).mock.calls).toEqual([
      [
        action.payload.update,
        rootState.unsavedForm,
        'pipetteEntitiesPlaceholder',
        'labwareEntitiesPlaceholder',
      ],
    ])
    expect(result).toEqual({
      existingField: 123,
      someField: 42,
    })
  })
  it("should switch out pipettes via handleFormChange in response to SUBSTITUTE_STEP_FORM_PIPETTES if the unsaved form's ID is in range", () => {
    const action: SubstituteStepFormPipettesAction = {
      type: 'SUBSTITUTE_STEP_FORM_PIPETTES',
      payload: {
        substitutionMap: {
          oldPipetteId: 'newPipetteId',
        },
        startStepId: '3',
        endStepId: '5',
        newTiprackURI: 'mockURI',
      },
    }
    const rootState: RootState = {
      orderedStepIds: ['1', '3', '4', '5', '6'],
      // @ts-expect-error(sa, 2021-6-14): add stepType to fixture
      unsavedForm: {
        pipette: 'oldPipetteId',
        id: '4',
        otherField: 'blah',
      },
    }
    vi.mocked(handleFormChange).mockReturnValue({
      pipette: 'newPipetteId',
    })
    vi.mocked(_getPipetteEntitiesRootState).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not a valid PipetteEntities Type
      'pipetteEntitiesPlaceholder'
    )
    vi.mocked(_getLabwareEntitiesRootState).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not a valid LabwareEntities Type
      'labwareEntitiesPlaceholder'
    )
    const result = unsavedForm(rootState, action)
    expect(vi.mocked(_getPipetteEntitiesRootState).mock.calls).toEqual([
      [rootState],
    ])
    expect(vi.mocked(_getLabwareEntitiesRootState).mock.calls).toEqual([
      [rootState],
    ])
    expect(vi.mocked(handleFormChange).mock.calls).toEqual([
      [
        {
          pipette: 'newPipetteId',
          tipRack: 'mockURI',
        },
        rootState.unsavedForm,
        'pipetteEntitiesPlaceholder',
        'labwareEntitiesPlaceholder',
      ],
    ])
    expect(result).toEqual({
      id: '4',
      pipette: 'newPipetteId',
      otherField: 'blah',
    })
  })
  const actionTypes: Array<UnsavedFormActions['type']> = [
    'CANCEL_STEP_FORM',
    'CREATE_MODULE',
    'DELETE_MODULE',
    'DELETE_MULTIPLE_STEPS',
    'SAVE_STEP_FORM',
    'SELECT_TERMINAL_ITEM',
    'SELECT_MULTIPLE_STEPS',
    'TOGGLE_IS_GRIPPER_REQUIRED',
  ]
  actionTypes.forEach(actionType => {
    it(`should clear the unsaved form when any ${actionType} action is dispatched`, () => {
      const result = unsavedForm(someState, {
        type: actionType,
      } as any)
      expect(result).toEqual(null)
    })
  })
  it('should return the result createPresavedStepForm util upon ADD_STEP action', () => {
    vi.mocked(createPresavedStepForm).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not a valid FormData Type
      'createPresavedStepFormMockResult'
    )
    vi.mocked(_getInitialDeckSetupRootState).mockReturnValue(
      // @ts-expect-error(sa, 2021-6-14): not valid InitialDeckSetup state
      'initalDeckSetupValue'
    )
    const stateMock: RootState = {
      // @ts-expect-error(sa, 2021-6-14): not valid savedStepForms state
      savedStepForms: 'savedStepFormsValue',
      // @ts-expect-error(sa, 2021-6-14): not valid orderedStepIds state
      orderedStepIds: 'orderedStepIdsValue',
    }
    const result = unsavedForm(stateMock, {
      type: 'ADD_STEP',
      payload: {
        id: 'stepId123',
        stepType: 'moveLiquid',
      },
      meta: {
        // @ts-expect-error(sa, 2021-6-14): not valid Timeline state
        robotStateTimeline: 'robotStateTimelineValue',
      },
    })
    expect(result).toEqual('createPresavedStepFormMockResult')
    expect(vi.mocked(createPresavedStepForm).mock.calls).toEqual([
      [
        {
          stepId: 'stepId123',
          stepType: 'moveLiquid',
          pipetteEntities: 'pipetteEntitiesPlaceholder',
          labwareEntities: 'labwareEntitiesPlaceholder',
          savedStepForms: 'savedStepFormsValue',
          orderedStepIds: 'orderedStepIdsValue',
          initialDeckSetup: 'initalDeckSetupValue',
          robotStateTimeline: 'robotStateTimelineValue',
        },
      ],
    ])
  })
})
describe('presavedStepForm reducer', () => {
  it('should populate when a new step is added', () => {
    const addStepAction: AddStepAction = {
      type: 'ADD_STEP',
      payload: {
        id: 'someId',
        // @ts-expect-error(sa, 2021-6-14): transfer is not a valid stepType, change to moveLiquid
        stepType: 'transfer',
      },
    }
    const result = presavedStepForm(null, addStepAction)
    expect(result).toEqual({
      stepType: 'transfer',
    })
  })
  it('should not update when the PRESAVED_STEP_ID terminal item is selected', () => {
    const prevState: PresavedStepFormState = {
      // @ts-expect-error(sa, 2021-6-14): transfer is not a valid stepType, change to moveLiquid
      stepType: 'transfer',
    }
    const action: SelectTerminalItemAction = {
      type: 'SELECT_TERMINAL_ITEM',
      payload: PRESAVED_STEP_ID,
    }
    expect(presavedStepForm(prevState, action)).toBe(prevState)
  })
  it('should clear when a different terminal item is selected', () => {
    const prevState: PresavedStepFormState = {
      // @ts-expect-error(sa, 2021-6-14): transfer is not a valid stepType, change to moveLiquid
      stepType: 'transfer',
    }
    const action: SelectTerminalItemAction = {
      type: 'SELECT_TERMINAL_ITEM',
      // @ts-expect-error(sa, 2021-6-14): transfer is not a valid TerminalItemId
      payload: 'otherId',
    }
    expect(presavedStepForm(prevState, action)).toEqual(null)
  })
  const clearingActions: Array<PresavedStepFormAction['type']> = [
    'CANCEL_STEP_FORM',
    'DELETE_MULTIPLE_STEPS',
    'SAVE_STEP_FORM',
    'SELECT_STEP',
    'SELECT_MULTIPLE_STEPS',
  ]
  clearingActions.forEach(actionType => {
    it(`should clear upon ${actionType}`, () => {
      const prevState: PresavedStepFormState = {
        id: 'someId',
        // @ts-expect-error(sa, 2021-6-14): transfer is not a valid stepType, change to moveLiquid
        stepType: 'transfer',
      }
      expect(
        // @ts-expect-error(sa, 2021-6-14): missing payload
        presavedStepForm(prevState, {
          type: actionType,
        })
      ).toEqual(null)
    })
  })
})
describe('batchEditFormChanges reducer', () => {
  it('should add the new fields into empty state on CHANGE_BATCH_EDIT_FIELD', () => {
    const state = {}
    const action: ChangeBatchEditFieldAction = {
      type: 'CHANGE_BATCH_EDIT_FIELD',
      payload: {
        someFieldName: 'someFieldValue',
      },
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({
      someFieldName: 'someFieldValue',
    })
  })
  it('should add the new fields into existing state on CHANGE_BATCH_EDIT_FIELD', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    const action: ChangeBatchEditFieldAction = {
      type: 'CHANGE_BATCH_EDIT_FIELD',
      payload: {
        anotherFieldName: 'anotherFieldValue',
      },
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({
      someFieldName: 'someFieldValue',
      anotherFieldName: 'anotherFieldValue',
    })
  })
  it('should reset state on RESET_BATCH_EDIT_FIELD_CHANGES', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    const action: ResetBatchEditFieldChangesAction = {
      type: 'RESET_BATCH_EDIT_FIELD_CHANGES',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
  it('should reset state on SAVE_STEP_FORMS_MULTI', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    // @ts-expect-error(sa, 2021-6-14): missing payload
    const action: SaveStepFormsMultiAction = {
      type: 'SAVE_STEP_FORMS_MULTI',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
  it('should reset state on SELECT_STEP', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    // @ts-expect-error(sa, 2021-6-14): missing payload
    const action: SelectStepAction = {
      type: 'SELECT_STEP',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
  it('should reset state on SELECT_MULTIPLE_STEPS', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    // @ts-expect-error(sa, 2021-6-14): missing payload
    const action: SelectMultipleStepsAction = {
      type: 'SELECT_MULTIPLE_STEPS',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
  it('should reset state on DUPLICATE_SELECTED_STEPS', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    // @ts-expect-error(sa, 2021-6-14): missing payload
    const action: DuplicateSelectedStepsAction = {
      type: 'DUPLICATE_SELECTED_STEPS',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
  it('should reset state on DELETE_MULTIPLE_STEPS', () => {
    const state = {
      someFieldName: 'someFieldValue',
    }
    // @ts-expect-error(sa, 2021-6-14): missing payload
    const action: DeleteMultipleStepsAction = {
      type: 'DELETE_MULTIPLE_STEPS',
    }
    expect(batchEditFormChanges(state, { ...action })).toEqual({})
  })
})
