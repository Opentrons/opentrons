import last from 'lodash/last'
import { legacy_configureStore } from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getRobotStateTimeline } from '/protocol-designer/file-data/selectors'
import * as stepFormSelectors from '/protocol-designer/step-forms/selectors'
import * as utils from '/protocol-designer/utils'

import {
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
} from '../../selectors'
import { deselectAllSteps, selectAllSteps } from '../actions'
import {
  duplicateSelectedSteps,
  saveHeaterShakerFormWithAddedPauseUntilTemp,
  saveSetTempFormWithAddedPauseUntilTemp,
} from '../thunks'

import type { RobotState, Timeline } from '@opentrons/step-generation/src/types'
import type {
  DuplicateSelectedStepsAction,
  SelectMultipleStepsAction,
  SelectStepAction,
} from '../types'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('../../selectors')
vi.mock('/protocol-designer/file-data/selectors')

const mockStore = legacy_configureStore([thunk] as any)

const initialRobotState: RobotState = {
  labware: {
    fixedTrash: {
      stack: ['fixedTrash', '12'],
    },
    tiprackId: {
      stack: ['tiprackId', '1'],
    },
    plateId: {
      stack: ['plateId', '7'],
    },
  },
  modules: {},
  pipettes: {
    pipetteId: {
      mount: 'left',
    },
  },
  liquidState: {
    pipettes: {},
    labware: {},
    trashBins: {},
    wasteChute: {},
  },
  tipState: {
    pipettes: {},
    tipracks: {},
  },
}

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
      when(vi.mocked(getMultiSelectLastSelected))
        .calledWith(expect.anything())
        .thenReturn(id)
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
      when(vi.mocked(getMultiSelectLastSelected))
        .calledWith(expect.anything())
        .thenReturn(null)
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
              thermocyclerProfileStepId: 'id_2',
              concurrentSteps: [
                {
                  type: 'standaloneStep',
                  stepId: 'id_3',
                },
              ],
              waitForThermocyclerProfileStepId: 'id_4',
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
      when(vi.mocked(getMultiSelectLastSelected))
        .calledWith(expect.anything())
        .thenReturn(null)
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
      when(vi.mocked(getMultiSelectLastSelected))
        .calledWith(expect.anything())
        .thenReturn('id_3')
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

  describe('saveHeaterShakerFormWithAddedPauseUntilTemp', () => {
    const mockRobotStateTimeline: Timeline = {
      timeline: [
        {
          commands: [
            {
              commandType: 'heaterShaker/waitForTemperature',

              params: {
                moduleId: 'heaterShakerId',
              },
            },
          ],
          robotState: initialRobotState,
          warnings: [],
        },
      ],
      errors: null,
    }

    beforeEach(() => {
      when(vi.mocked(stepFormSelectors.getUnsavedForm))
        .calledWith(expect.anything())
        .thenReturn({
          stepType: 'heaterShaker',
          targetHeaterShakerTemperature: '10',
        } as any)
      vi.mocked(
        stepFormSelectors.getUnsavedFormIsPristineHeaterShakerForm
      ).mockReturnValue(true)
      vi.mocked(getRobotStateTimeline).mockReturnValue(mockRobotStateTimeline)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should save heater shaker step with a pause until temp is reached', () => {
      const HsStepWithPause = [
        {
          payload: {
            stepType: 'heaterShaker',
            targetHeaterShakerTemperature: '10',
          },
          type: 'SAVE_STEP_FORM',
        },

        {
          meta: {
            robotStateTimeline: {
              errors: null,
              timeline: [
                {
                  commands: [
                    {
                      commandType: 'heaterShaker/waitForTemperature',
                      params: {
                        moduleId: 'heaterShakerId',
                      },
                    },
                  ],
                  robotState: {
                    labware: {
                      fixedTrash: {
                        stack: ['fixedTrash', '12'],
                      },
                      tiprackId: {
                        stack: ['tiprackId', '1'],
                      },
                      plateId: {
                        stack: ['plateId', '7'],
                      },
                    },
                    liquidState: {
                      labware: {},
                      pipettes: {},
                      trashBins: {},
                      wasteChute: {},
                    },
                    modules: {},
                    pipettes: {
                      pipetteId: {
                        mount: 'left',
                      },
                    },
                    tipState: {
                      pipettes: {},
                      tipracks: {},
                    },
                  },
                  warnings: [],
                },
              ],
            },
          },
          payload: {
            id: '__presaved_step__',
            stepType: 'pause',
          },
          type: 'ADD_STEP',
        },
        {
          payload: {
            update: {
              pauseAction: 'untilTemperature',
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            update: {
              moduleId: undefined,
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            update: {
              pauseTemperature: '10',
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            stepType: 'heaterShaker',
            targetHeaterShakerTemperature: '10',
          },
          type: 'SAVE_STEP_FORM',
        },
      ]

      const store: any = mockStore()
      store.dispatch(saveHeaterShakerFormWithAddedPauseUntilTemp())

      expect(store.getActions()).toEqual(HsStepWithPause)
    })
  })

  describe('saveSetTempFormWithAddedPauseUntilTemp', () => {
    const mockRobotStateTimeline: Timeline = {
      timeline: [
        {
          commands: [
            {
              commandType: 'temperatureModule/setTargetTemperature',

              params: {
                moduleId: 'temperatureId',
                celsius: 25,
              },
            },
          ],
          robotState: initialRobotState,
          warnings: [],
        },
      ],
      errors: null,
    }

    beforeEach(() => {
      when(vi.mocked(stepFormSelectors.getUnsavedForm))
        .calledWith(expect.anything())
        .thenReturn({
          stepType: 'temperature',
          setTemperature: 'true',
          targetTemperature: 10,
          moduleId: 'mockTemp',
        } as any)
      vi.mocked(
        stepFormSelectors.getUnsavedFormIsPristineSetTempForm
      ).mockReturnValue(true)
      vi.mocked(getRobotStateTimeline).mockReturnValue(mockRobotStateTimeline)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should save temperature step with a pause until temp is reached', () => {
      const temperatureStepWithPause = [
        {
          payload: {
            setTemperature: 'true',
            stepType: 'temperature',
            targetTemperature: 10,
            moduleId: 'mockTemp',
          },
          type: 'SAVE_STEP_FORM',
        },

        {
          meta: {
            robotStateTimeline: {
              errors: null,
              timeline: [
                {
                  commands: [
                    {
                      commandType: 'temperatureModule/setTargetTemperature',
                      params: {
                        moduleId: 'temperatureId',
                        celsius: 25,
                      },
                    },
                  ],
                  robotState: {
                    labware: {
                      plateId: {
                        stack: ['plateId', '7'],
                      },
                      tiprackId: {
                        stack: ['tiprackId', '1'],
                      },

                      fixedTrash: {
                        stack: ['fixedTrash', '12'],
                      },
                    },
                    liquidState: {
                      labware: {},
                      pipettes: {},
                      trashBins: {},
                      wasteChute: {},
                    },
                    modules: {},
                    pipettes: {
                      pipetteId: {
                        mount: 'left',
                      },
                    },
                    tipState: {
                      pipettes: {},
                      tipracks: {},
                    },
                  },
                  warnings: [],
                },
              ],
            },
          },
          payload: {
            id: '__presaved_step__',
            stepType: 'pause',
          },
          type: 'ADD_STEP',
        },
        {
          payload: {
            update: {
              pauseAction: 'untilTemperature',
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            update: {
              moduleId: 'mockTemp',
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            update: {
              pauseTemperature: 10,
            },
          },
          type: 'CHANGE_FORM_INPUT',
        },
        {
          payload: {
            setTemperature: 'true',
            stepType: 'temperature',
            targetTemperature: 10,
            moduleId: 'mockTemp',
          },
          type: 'SAVE_STEP_FORM',
        },
      ]

      const store: any = mockStore()
      store.dispatch(saveSetTempFormWithAddedPauseUntilTemp())

      expect(store.getActions()).toEqual(temperatureStepWithPause)
    })
  })
})
