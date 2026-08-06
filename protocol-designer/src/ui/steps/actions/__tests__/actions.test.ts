import last from 'lodash/last'
import { legacy_configureStore } from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getRobotStateTimeline } from '/protocol-designer/file-data/selectors'
import * as stepFormSelectors from '/protocol-designer/step-forms/selectors'
import * as tutorialSelectors from '/protocol-designer/tutorial/selectors'
import * as utils from '/protocol-designer/utils'

import {
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
} from '../../selectors'
import { deselectAllSteps, selectAllSteps } from '../actions'
import {
  duplicateSelectedSteps,
  reorderSelectedStep,
  saveStepForm,
} from '../thunks'

import type { Timeline } from '@opentrons/step-generation/src/types'
import type { FormData } from '/protocol-designer/form-types'
import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'
import type {
  DuplicateSelectedStepsAction,
  SelectMultipleStepsAction,
  SelectStepAction,
} from '../types'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/tutorial/selectors')
vi.mock('../../selectors')
vi.mock('/protocol-designer/file-data/selectors')

const mockStore = legacy_configureStore([thunk] as any)

describe('steps actions', () => {
  describe('selectAllSteps', () => {
    let ids: string[]
    beforeEach(() => {
      ids = ['id_1', 'id_2']
      when(vi.mocked(stepFormSelectors.getOrderedStepIds))
        .calledWith(expect.anything())
        .thenReturn(ids)
    })
    afterEach(() => {
      vi.resetAllMocks()
    })
    it('should select all of the steps', () => {
      const store: any = mockStore()
      store.dispatch(selectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: ids,
          lastSelected: last(ids),
        },
      })
    })
    it('should register an analytics event', () => {
      const store: any = mockStore()
      store.dispatch(selectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'selectAllSteps',
          properties: {},
        },
      })
    })
  })
  describe('deselectAllSteps', () => {
    const id = 'some_id'
    beforeEach(() => {
      vi.mocked(getMultiSelectLastSelected).mockReturnValue(id)
    })
    afterEach(() => {
      vi.resetAllMocks()
    })
    it('should deselect all of the steps', () => {
      const store: any = mockStore()
      store.dispatch(deselectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'SELECT_STEP',
        payload: id,
      })
    })
    it('should register a "deslectAllSteps" analytics event', () => {
      const store: any = mockStore()
      store.dispatch(deselectAllSteps())
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'deselectAllSteps',
          properties: {},
        },
      })
    })
    it('should register a "exitBatchEditMode" analytics event when given a meta flag', () => {
      const store: any = mockStore()
      store.dispatch(deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'))
      expect(store.getActions()).toContainEqual({
        type: 'ANALYTICS_EVENT',
        payload: {
          name: 'exitBatchEditMode',
          properties: {},
        },
      })
    })
    it('should console warn when NOT in multi select mode', () => {
      vi.mocked(getMultiSelectLastSelected).mockReturnValue(null)
      const consoleWarnSpy = vi
        .spyOn(global.console, 'warn')
        .mockImplementation(() => null)
      const store: any = mockStore()
      store.dispatch(deselectAllSteps())
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'something went wrong, cannot deselect all steps if not in multi select mode'
      )
      consoleWarnSpy.mockRestore()
    })
  })
  describe('duplicateSelectedSteps', () => {
    beforeEach(() => {
      when(vi.mocked(stepFormSelectors.getSavedStepHierarchy))
        .calledWith(expect.anything())
        .thenReturn({
          topLevelItems: [
            {
              type: 'standaloneStep',
              stepId: 'id_1',
            },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: 'id_2',
              concurrentSteps: [
                {
                  type: 'standaloneStep',
                  stepId: 'id_3',
                },
              ],
              waitStepId: 'id_4',
            },
            {
              type: 'standaloneStep',
              stepId: 'id_5',
            },
          ],
        })
    })
    afterEach(() => {
      vi.resetAllMocks()
      vi.restoreAllMocks()
    })
    it('should duplicate a single-selected step', () => {
      when(vi.mocked(getSelectedStepId))
        .calledWith(expect.anything())
        .thenReturn('id_3')
      when(vi.mocked(getMultiSelectItemIds))
        .calledWith(expect.anything())
        .thenReturn(null)
      vi.mocked(getMultiSelectLastSelected).mockReturnValue(null)
      vi.spyOn(utils, 'uuid').mockReturnValueOnce('dup')
      const store: any = mockStore()
      store.dispatch(duplicateSelectedSteps())
      const expectedDuplicateAction: DuplicateSelectedStepsAction = {
        type: 'DUPLICATE_SELECTED_STEPS',
        payload: {
          steps: [
            {
              originalStepId: 'id_3',
              duplicateStepId: 'dup',
            },
          ],
          newStepOrder: ['id_1', 'id_2', 'id_3', 'dup', 'id_4', 'id_5'],
        },
      }
      const expectedSelectAction: SelectStepAction = {
        type: 'SELECT_STEP',
        payload: 'dup',
      }
      expect(store.getActions()).toEqual([
        expectedDuplicateAction,
        expectedSelectAction,
      ])
    })
    it('should duplicate multi-selected steps', () => {
      when(vi.mocked(getSelectedStepId))
        .calledWith(expect.anything())
        .thenReturn(null)
      when(vi.mocked(getMultiSelectItemIds))
        .calledWith(expect.anything())
        .thenReturn(['id_2', 'id_3'])
      vi.mocked(getMultiSelectLastSelected).mockReturnValue('id_3')
      vi.spyOn(utils, 'uuid')
        .mockReturnValueOnce('dup_of_2')
        .mockReturnValueOnce('dup_of_3')
        .mockReturnValueOnce('dup_of_4')
      const store: any = mockStore()
      store.dispatch(duplicateSelectedSteps())
      const expectedDuplicateAction: DuplicateSelectedStepsAction = {
        type: 'DUPLICATE_SELECTED_STEPS',
        payload: {
          steps: [
            {
              originalStepId: 'id_2',
              duplicateStepId: 'dup_of_2',
            },
            {
              originalStepId: 'id_3',
              duplicateStepId: 'dup_of_3',
            },
            {
              originalStepId: 'id_4',
              duplicateStepId: 'dup_of_4',
            },
          ],
          newStepOrder: [
            'id_1',
            'id_2',
            'id_3',
            'id_4',
            'dup_of_2',
            'dup_of_3',
            'dup_of_4',
            'id_5',
          ],
        },
      }
      const expectedSelectAction: SelectMultipleStepsAction = {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          // dup_of_4 is the new "wait for profile to complete" step, which is hidden
          // in the UI and should not be selected.
          stepIds: ['dup_of_2', 'dup_of_3'],
          lastSelected: 'dup_of_3',
        },
      }
      expect(store.getActions()).toEqual([
        expectedDuplicateAction,
        expectedSelectAction,
      ])
    })
  })

  describe('saveStepForm', () => {
    beforeEach(() => {
      vi.mocked(getRobotStateTimeline).mockReturnValue({
        timeline: [],
        errors: null,
      } as Timeline)
      vi.mocked(tutorialSelectors.shouldShowCoolingHint).mockReturnValue(false)
      vi.mocked(tutorialSelectors.shouldShowWasteChuteHint).mockReturnValue(
        false
      )
    })

    afterEach(() => {
      vi.resetAllMocks()
      vi.restoreAllMocks()
    })

    describe('temperature module form', () => {
      it.each([
        {
          description: 'should save the temperature step plus a pause step',
          isPresaved: true,
          targetTemperature: 25,
          expectingPauseStep: true,
        },
        {
          description:
            'should not add the pause step when the temperature step is not brand new',
          isPresaved: false,
          targetTemperature: 25,
          expectingPauseStep: false,
        },
        {
          description:
            'should not add the pause step when there is no target temperature',
          isPresaved: true,
          targetTemperature: null,
          expectingPauseStep: false,
        },
      ])(
        '$description',
        ({ isPresaved, targetTemperature, expectingPauseStep }) => {
          const temperatureForm: FormData = {
            id: 'step_123',
            stepType: 'temperature',
            targetTemperature,
            moduleId: 'temperatureId',
          }

          when(vi.mocked(stepFormSelectors.getUnsavedForm))
            .calledWith(expect.anything())
            .thenReturn(temperatureForm)
          when(vi.mocked(stepFormSelectors.getCurrentFormIsPresaved))
            .calledWith(expect.anything())
            .thenReturn(isPresaved)

          const store: any = mockStore()
          store.dispatch(saveStepForm())

          const actions = store.getActions()

          // Main step:
          expect(actions[0]).toEqual({
            type: 'SAVE_STEP_FORM',
            payload: {
              form: temperatureForm,
              concurrentGroupPauseStepId: expect.any(String),
            },
          })

          // Bonus "wait for temperature" step:
          if (expectingPauseStep) {
            expect(actions[1].type).toStrictEqual('ADD_STEP')
            expect(actions[2].payload.update.pauseAction).toStrictEqual(
              'untilTemperature'
            )
            expect(actions[3].payload.update.moduleId).toStrictEqual(
              'temperatureId'
            )
            expect(actions[4].payload.update.pauseTemperature).toStrictEqual(
              targetTemperature
            )
            expect(actions[5].type).toStrictEqual('SAVE_STEP_FORM')
            expect(actions[6].type).toStrictEqual('ADD_HINT')
          } else {
            expect(actions).toHaveLength(1)
          }
        }
      )
    })

    describe('heater shaker form', () => {
      it.each([
        {
          description: 'should save the Heater-Shaker step plus a pause step',
          isPresaved: true,
          targetHeaterShakerTemperature: 25,
          expectingPauseStep: true,
        },
        {
          description:
            'should not add the pause step when the Heater-Shaker step is not brand new',
          isPresaved: false,
          targetHeaterShakerTemperature: 25,
          expectingPauseStep: false,
        },
        {
          description:
            'should not add the pause step when there is no target temperature',
          isPresaved: true,
          targetHeaterShakerTemperature: null,
          expectingPauseStep: false,
        },
      ])(
        '$description',
        ({ isPresaved, targetHeaterShakerTemperature, expectingPauseStep }) => {
          const heaterShakerForm: FormData = {
            id: 'step_123',
            stepType: 'heaterShaker',
            targetHeaterShakerTemperature,
            moduleId: 'heaterShakerId',
          }

          when(vi.mocked(stepFormSelectors.getUnsavedForm))
            .calledWith(expect.anything())
            .thenReturn(heaterShakerForm)
          when(vi.mocked(stepFormSelectors.getCurrentFormIsPresaved))
            .calledWith(expect.anything())
            .thenReturn(isPresaved)

          const store: any = mockStore()
          store.dispatch(saveStepForm())

          const actions = store.getActions()

          // Main step:
          expect(actions[0]).toEqual({
            type: 'SAVE_STEP_FORM',
            payload: {
              form: heaterShakerForm,
              concurrentGroupPauseStepId: expect.any(String),
            },
          })

          // Bonus "wait for temperature" step:
          if (expectingPauseStep) {
            expect(actions[1].type).toStrictEqual('ADD_STEP')
            expect(actions[2].payload.update.pauseAction).toStrictEqual(
              'untilTemperature'
            )
            expect(actions[3].payload.update.moduleId).toStrictEqual(
              'heaterShakerId'
            )
            expect(actions[4].payload.update.pauseTemperature).toStrictEqual(
              targetHeaterShakerTemperature
            )
            expect(actions[5].type).toStrictEqual('SAVE_STEP_FORM')
            expect(actions[6].type).toStrictEqual('ADD_HINT')
          } else {
            expect(actions).toHaveLength(1)
          }
        }
      )
    })
  })

  describe('reorderSelectedStep', () => {
    const mockStepHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          stepId: 'step_1',
          type: 'standaloneStep',
        },
        {
          stepId: 'step_2',
          type: 'standaloneStep',
        },
        {
          stepId: 'step_3',
          type: 'standaloneStep',
        },
      ],
    }

    beforeEach(() => {
      when(vi.mocked(stepFormSelectors.getSavedStepHierarchy))
        .calledWith(expect.anything())
        .thenReturn(mockStepHierarchy)
    })

    afterEach(() => {
      vi.resetAllMocks()
      vi.restoreAllMocks()
    })

    it('should dispatch REORDER_STEPS action when a step is selected', () => {
      when(vi.mocked(getSelectedStepId))
        .calledWith(expect.anything())
        .thenReturn('step_2')

      const store: any = mockStore()
      store.dispatch(reorderSelectedStep('up'))

      expect(store.getActions()).toStrictEqual([
        {
          type: 'REORDER_STEPS',
          payload: {
            stepIds: ['step_2', 'step_1', 'step_3'],
          },
        },
      ])
    })

    it('should not dispatch any action when no step is selected', () => {
      when(vi.mocked(getSelectedStepId))
        .calledWith(expect.anything())
        .thenReturn(null)

      const store: any = mockStore()
      store.dispatch(reorderSelectedStep('up'))

      expect(store.getActions()).toStrictEqual([])
    })
  })
})
