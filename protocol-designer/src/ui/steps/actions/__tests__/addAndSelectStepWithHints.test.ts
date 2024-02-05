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
  vi.mocked(uiModuleSelectors.getTemperatureModuleHasLabware).mockReturnValue(false)
  vi.mocked(uiModuleSelectors.getThermocyclerModuleHasLabware).mockReturnValue(false)
  vi.mocked(uiModuleSelectors.getSingleTemperatureModuleId).mockReturnValue(null)
  vi.mocked(uiModuleSelectors.getSingleThermocyclerModuleId).mockReturnValue(null)
  vi.mocked(fileDataSelectors.getRobotStateTimeline).mockReturnValue('mockGetRobotStateTimelineValue' as any)
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
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: null,
        },
      },
      {
        testName: 'temperature step, when temperature module has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: 'something',
          getSingleThermocyclerModuleId: null,
        },
      },
      {
        testName: 'temperature step, when thermocycler has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: 'something',
        },
      },
    ].forEach(({ testName, stepType, selectorValues }) => {
      it(`should be dispatched (after addStep thunk is dispatched) for ${testName}`, () => {
        vi.mocked(uiModuleSelectors.getMagnetModuleHasLabware).mockReturnValue(
          selectorValues.getMagnetModuleHasLabware
        )
        vi.mocked(uiModuleSelectors.getTemperatureModuleHasLabware).mockReturnValue(
          selectorValues.getTemperatureModuleHasLabware
        )
        vi.mocked(uiModuleSelectors.getThermocyclerModuleHasLabware).mockReturnValue(
          selectorValues.getThermocyclerModuleHasLabware
        )
        vi.mocked(uiModuleSelectors.getSingleTemperatureModuleId).mockReturnValue(
          selectorValues.getSingleTemperatureModuleId
        )
        vi.mocked(uiModuleSelectors.getSingleThermocyclerModuleId).mockReturnValue(
          selectorValues.getSingleThermocyclerModuleId
        )
        const payload = {
          stepType,
        }
        addAndSelectStepWithHints(payload)(dispatch, getState)
        expect(vi.mocked(addHint).mock.calls).toEqual([['module_without_labware']])
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
