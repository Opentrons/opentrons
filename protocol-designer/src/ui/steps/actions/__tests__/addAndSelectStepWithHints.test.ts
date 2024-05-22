import { describe, expect, it, vi, beforeEach } from 'vitest'
import { addAndSelectStepWithHints } from '../thunks'
import { PRESAVED_STEP_ID } from '../../../../steplist/types'
import { addHint } from '../../../../tutorial/actions'
import * as uiModuleSelectors from '../../../../ui/modules/selectors'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import * as fileDataSelectors from '../../../../file-data/selectors'
import type { StepType } from '../../../../form-types'

vi.mock('../../../../tutorial/actions')
vi.mock('../../../../ui/modules/selectors')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../file-data/selectors')
const dispatch = vi.fn()
const getState = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(addHint).mockReturnValue('addHintReturnValue' as any)
  vi.mocked(labwareIngredSelectors.getDeckHasLiquid).mockReturnValue(true)
  vi.mocked(uiModuleSelectors.getMagnetModuleHasLabware).mockReturnValue(false)
  vi.mocked(uiModuleSelectors.getTemperatureModulesHaveLabware).mockReturnValue(
    []
  )
  vi.mocked(uiModuleSelectors.getThermocyclerModuleHasLabware).mockReturnValue(
    false
  )
  vi.mocked(uiModuleSelectors.getTemperatureModuleIds).mockReturnValue(null)
  vi.mocked(uiModuleSelectors.getHeaterShakerModuleHasLabware).mockReturnValue(
    false
  )
  vi.mocked(uiModuleSelectors.getSingleThermocyclerModuleId).mockReturnValue(
    null
  )
  vi.mocked(fileDataSelectors.getRobotStateTimeline).mockReturnValue(
    'mockGetRobotStateTimelineValue' as any
  )
})
describe('addAndSelectStepWithHints', () => {
  it('should dispatch addStep thunk, and no hints when no hints are applicable (eg pause step)', () => {
    const stepType: StepType = 'pause'
    const payload = {
      stepType,
    }
    addAndSelectStepWithHints(payload)(dispatch, getState)
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'pause',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
    ])
  })
  it('should dispatch addStep thunk, and also ADD_HINT "add_liquids_and_labware" if we\'re adding a step that uses liquid but have no liquids on the deck', () => {
    const stepType: StepType = 'moveLiquid'
    const payload = {
      stepType,
    }
    vi.mocked(labwareIngredSelectors.getDeckHasLiquid).mockReturnValue(false) // no liquid!

    addAndSelectStepWithHints(payload)(dispatch, getState)
    expect(vi.mocked(addHint).mock.calls).toEqual([['add_liquids_and_labware']])
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'moveLiquid',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
      ['addHintReturnValue'],
    ])
  })
  describe('ADD_HINT "module_without_labware"', () => {
    ;[
      {
        testName: 'magnet step, when magnetic module has no labware',
        stepType: 'magnet' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModulesHaveLabware: [],
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: null,
          getTemperatureModuleIds: [],
          getHeaterShakerModuleHasLabware: false,
        },
      },
      {
        testName: 'temperature step, when temperature module has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModulesHaveLabware: [
            { moduleId: 'mockId', hasLabware: false },
          ],
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: 'something',
          getSingleThermocyclerModuleId: null,
          getTemperatureModuleIds: [],
          getHeaterShakerModuleHasLabware: false,
        },
      },
      {
        testName: 'thermocycler step, when thermocycler has no labware',
        stepType: 'thermocycler' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModulesHaveLabware: [],
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: 'something',
          getTemperatureModuleIds: [],
          getHeaterShakerModuleHasLabware: false,
        },
      },
      {
        testName: 'heaterShaker step, when heaterShaker has no labware',
        stepType: 'heaterShaker' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModulesHaveLabware: [],
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: 'something',
          getTemperatureModuleIds: [],
          getHeaterShakerModuleHasLabware: false,
        },
      },
    ].forEach(({ testName, stepType, selectorValues }) => {
      it(`should be dispatched (after addStep thunk is dispatched) for ${testName}`, () => {
        vi.mocked(uiModuleSelectors.getMagnetModuleHasLabware).mockReturnValue(
          selectorValues.getMagnetModuleHasLabware
        )
        vi.mocked(
          uiModuleSelectors.getTemperatureModulesHaveLabware
        ).mockReturnValue(selectorValues.getTemperatureModulesHaveLabware)
        vi.mocked(
          uiModuleSelectors.getHeaterShakerModuleHasLabware
        ).mockReturnValue(selectorValues.getHeaterShakerModuleHasLabware)
        vi.mocked(
          uiModuleSelectors.getThermocyclerModuleHasLabware
        ).mockReturnValue(selectorValues.getThermocyclerModuleHasLabware)
        vi.mocked(uiModuleSelectors.getTemperatureModuleIds).mockReturnValue(
          selectorValues.getTemperatureModuleIds
        )
        vi.mocked(
          uiModuleSelectors.getSingleThermocyclerModuleId
        ).mockReturnValue(selectorValues.getSingleThermocyclerModuleId)
        const payload = {
          stepType,
        }
        addAndSelectStepWithHints(payload)(dispatch, getState)
        expect(vi.mocked(addHint).mock.calls).toEqual([
          ['module_without_labware'],
        ])
        expect(dispatch.mock.calls).toEqual([
          [
            {
              type: 'ADD_STEP',
              payload: {
                id: PRESAVED_STEP_ID,
                stepType,
              },
              meta: {
                robotStateTimeline: 'mockGetRobotStateTimelineValue',
              },
            },
          ],
          ['addHintReturnValue'],
        ])
      })
    })
  })
  describe('ADD_HINT "multiple_modules_without_labware"', () => {
    ;[
      {
        testName: 'temperature step, when temperature module has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModulesHaveLabware: [
            { moduleId: 'mockId', hasLabware: false },
            { moduleId: 'mockId2', hasLabware: true },
          ],
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: 'something',
          getSingleThermocyclerModuleId: null,
          getTemperatureModuleIds: ['mockId', 'mockId2'],
        },
      },
    ].forEach(({ testName, stepType, selectorValues }) => {
      it(`should be dispatched (after addStep thunk is dispatched) for ${testName}`, () => {
        vi.mocked(
          uiModuleSelectors.getTemperatureModulesHaveLabware
        ).mockReturnValue(selectorValues.getTemperatureModulesHaveLabware)

        vi.mocked(uiModuleSelectors.getTemperatureModuleIds).mockReturnValue(
          selectorValues.getTemperatureModuleIds
        )

        const payload = {
          stepType,
        }
        addAndSelectStepWithHints(payload)(dispatch, getState)
        expect(vi.mocked(addHint).mock.calls).toEqual([
          ['multiple_modules_without_labware'],
        ])
        expect(dispatch.mock.calls).toEqual([
          [
            {
              type: 'ADD_STEP',
              payload: {
                id: PRESAVED_STEP_ID,
                stepType,
              },
              meta: {
                robotStateTimeline: 'mockGetRobotStateTimelineValue',
              },
            },
          ],
          ['addHintReturnValue'],
        ])
      })
    })
  })
})
