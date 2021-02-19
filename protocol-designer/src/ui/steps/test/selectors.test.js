// @flow
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  END_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
  START_TERMINAL_ITEM_ID,
} from '../../../steplist/types'
import {
  SINGLE_STEP_SELECTION_TYPE,
  MULTI_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
} from '../reducers'
import {
  getHoveredStepLabware,
  getSelectedStepTitleInfo,
  getActiveItem,
  getMultiSelectLastSelected,
  getMultiSelectFieldValues,
  getMultiSelectDisabledFields,
  getCountPerStepType,
  getBatchEditSelectedStepTypes,
} from '../selectors'
import { getMockMoveLiquidStep } from '../__fixtures__'

import * as utils from '../../modules/utils'

function createArgsForStepId(stepId, stepArgs) {
  return {
    [stepId]: {
      stepArgs,
    },
  }
}

const hoveredStepId = 'hoveredStepId'
const labware = 'well plate'
const mixCommand = 'mix'
describe('getHoveredStepLabware', () => {
  let initialDeckState
  beforeEach(() => {
    initialDeckState = {
      labware: {},
      pipettes: {},
      modules: {},
    }
  })

  it('no labware is returned when no hovered step', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)
    const hoveredStep = null

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStep,
      initialDeckState
    )

    expect(result).toEqual([])
  })

  it('no labware is returned when step is not found', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)
    const hoveredStep = 'another-step'

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStep,
      initialDeckState
    )

    expect(result).toEqual([])
  })

  it('no labware is returned when no step arguments', () => {
    const stepArgs = null
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStepId,
      initialDeckState
    )

    expect(result).toEqual([])
  })
  ;['consolidate', 'distribute', 'transfer'].forEach(command => {
    it(`source and destination labware is returned when ${command}`, () => {
      const sourceLabware = 'test tube'
      const stepArgs = {
        commandCreatorFnName: command,
        destLabware: labware,
        sourceLabware,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([sourceLabware, labware])
    })
  })

  it('labware is returned when command is mix', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStepId,
      initialDeckState
    )

    expect(result).toEqual([labware])
  })

  describe('modules', () => {
    const type = TEMPERATURE_MODULE_TYPE
    const setTempCommand = 'setTemperature'
    beforeEach(() => {
      initialDeckState = {
        labware: {
          def098: {
            slot: type,
          },
        },
        pipettes: {},
        modules: {
          abc123: {
            id: 'abc123',
            type,
            model: 'someTempModel',
            slot: '1',
            moduleState: {
              type,
              status: 'TEMPERATURE_DEACTIVATED',
              targetTemperature: null,
            },
          },
        },
      }
    })

    it('labware on module is returned when module id exists', () => {
      utils.getLabwareOnModule = jest.fn().mockReturnValue({ id: labware })
      const stepArgs = {
        commandCreatorFnName: setTempCommand,
        module: type,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([labware])
    })

    it('no labware is returned when no labware on module', () => {
      utils.getLabwareOnModule = jest.fn().mockReturnValue(null)
      const stepArgs = {
        commandCreatorFnName: setTempCommand,
        module: type,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([])
    })
  })
})

describe('getSelectedStepTitleInfo', () => {
  it('should return title info of the presaved form when the presaved terminal item is selected', () => {
    const unsavedForm = { stepName: 'The Step', stepType: 'transfer' }
    const result = getSelectedStepTitleInfo.resultFunc(
      unsavedForm,
      {},
      null,
      PRESAVED_STEP_ID
    )
    expect(result).toEqual({
      stepName: unsavedForm.stepName,
      stepType: unsavedForm.stepType,
    })
  })

  it('should return null when the start or end terminal item is selected', () => {
    const terminals = [START_TERMINAL_ITEM_ID, END_TERMINAL_ITEM_ID]
    terminals.forEach(terminalId => {
      const unsavedForm = { stepName: 'The Step', stepType: 'transfer' }
      const result = getSelectedStepTitleInfo.resultFunc(
        unsavedForm,
        {},
        null,
        PRESAVED_STEP_ID
      )
      expect(result).toEqual({
        stepName: unsavedForm.stepName,
        stepType: unsavedForm.stepType,
      })
    })
  })

  it('should return title info of the saved step when a saved step is selected', () => {
    const savedForm = { stepName: 'The Step', stepType: 'transfer' }
    const stepId = 'selectedAndSavedStepId'
    const result = getSelectedStepTitleInfo.resultFunc(
      null,
      { [stepId]: savedForm },
      stepId,
      null
    )
    expect(result).toEqual({
      stepName: savedForm.stepName,
      stepType: savedForm.stepType,
    })
  })
})

describe('getActiveItem', () => {
  const testCases = [
    {
      title: 'should show what is hovered, if anything is hovered',
      selected: {
        selectionType: MULTI_STEP_SELECTION_TYPE,
        ids: ['notTheseSteps', 'nope'],
      },
      hovered: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'hoveredId',
      },
      expected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'hoveredId',
      },
    },
    {
      title:
        'should return null, if nothing is hovered and multi-select is selected',
      selected: {
        selectionType: MULTI_STEP_SELECTION_TYPE,
        ids: ['notTheseSteps', 'nope'],
      },
      hovered: null,
      expected: null,
    },
    {
      title: 'should show the single-selected step item, if nothing is hovered',
      selected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'singleStepId',
      },
      hovered: null,
      expected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'singleStepId',
      },
    },
    {
      title:
        'should show the single-selected terminal item, if nothing is hovered',
      selected: {
        selectionType: TERMINAL_ITEM_SELECTION_TYPE,
        id: 'someItem',
      },
      hovered: null,
      expected: {
        selectionType: TERMINAL_ITEM_SELECTION_TYPE,
        id: 'someItem',
      },
    },
  ]

  testCases.forEach(({ title, selected, hovered, expected }) => {
    it(title, () => {
      const result = getActiveItem.resultFunc(selected, hovered)
      expect(result).toEqual(expected)
    })
  })
})

describe('getMultiSelectLastSelected', () => {
  it('should return null if the selected item is a single step', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: SINGLE_STEP_SELECTION_TYPE,
      id: 'foo',
    })
    expect(result).toEqual(null)
  })
  it('should return null if the selected item is a terminal item', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: TERMINAL_ITEM_SELECTION_TYPE,
      id: 'foo',
    })
    expect(result).toEqual(null)
  })
  it('should return the lastSelected step Id if the selected item is a multi-selection', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: MULTI_STEP_SELECTION_TYPE,
      ids: ['foo', 'spam', 'bar'],
      lastSelected: 'spam',
    })
    expect(result).toEqual('spam')
  })
})

describe('getMultiSelectFieldValues', () => {
  let mockSavedStepForms
  let mockmultiSelectItemIds

  beforeEach(() => {
    mockSavedStepForms = {
      ...getMockMoveLiquidStep(),
      // just doing this so the ids are not the exact same
      another_move_liquid_step_id: {
        ...getMockMoveLiquidStep().move_liquid_step_id,
      },
    }
    mockmultiSelectItemIds = [
      'move_liquid_step_id',
      'another_move_liquid_step_id',
    ]
  })
  afterEach(() => {})
  it('should return null if any of the forms are not moveLiquid type', () => {
    const savedStepForms = {
      ...mockSavedStepForms,
      another_move_liquid_step_id: {
        ...mockSavedStepForms.another_move_liquid_step_id,
        stepType: 'notMoveLiquid',
      },
    }
    expect(
      getMultiSelectFieldValues.resultFunc(
        savedStepForms,
        mockmultiSelectItemIds
      )
    ).toBe(null)
  })
  describe('when fields are NOT indeterminate', () => {
    it('should return the fields with the indeterminate boolean', () => {
      expect(
        getMultiSelectFieldValues.resultFunc(
          mockSavedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        // aspirate settings
        aspirate_flowRate: {
          value: null,
          isIndeterminate: false,
        },
        aspirate_mmFromBottom: {
          value: 1,
          isIndeterminate: false,
        },
        aspirate_wellOrder_first: {
          value: 't2b',
          isIndeterminate: false,
        },
        aspirate_wellOrder_second: {
          value: 'l2r',
          isIndeterminate: false,
        },
        preWetTip: {
          value: false,
          isIndeterminate: false,
        },
        aspirate_mix_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        aspirate_mix_times: {
          value: '2',
          isIndeterminate: false,
        },
        aspirate_mix_volume: {
          value: '5',
          isIndeterminate: false,
        },
        aspirate_delay_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        aspirate_delay_seconds: {
          value: '2',
          isIndeterminate: false,
        },
        aspirate_delay_mmFromBottom: {
          value: '1',
          isIndeterminate: false,
        },
        aspirate_airGap_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        aspirate_airGap_volume: {
          value: '30',
          isIndeterminate: false,
        },
        aspirate_touchTip_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        aspirate_touchTip_mmFromBottom: {
          value: 1,
          isIndeterminate: false,
        },
        // dispense settings
        dispense_flowRate: {
          value: null,
          isIndeterminate: false,
        },
        dispense_mmFromBottom: {
          value: 0.5,
          isIndeterminate: false,
        },
        dispense_wellOrder_first: {
          value: 't2b',
          isIndeterminate: false,
        },
        dispense_wellOrder_second: {
          value: 'l2r',
          isIndeterminate: false,
        },
        dispense_mix_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        dispense_mix_times: {
          value: null,
          isIndeterminate: false,
        },
        dispense_mix_volume: {
          value: null,
          isIndeterminate: false,
        },
        dispense_delay_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        dispense_delay_seconds: {
          value: '1',
          isIndeterminate: false,
        },
        dispense_delay_mmFromBottom: {
          value: '0.5',
          isIndeterminate: false,
        },
        dispense_airGap_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        dispense_airGap_volume: {
          value: null,
          isIndeterminate: false,
        },
        dispense_touchTip_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        dispense_touchTip_mmFromBottom: {
          value: 1,
          isIndeterminate: false,
        },
        blowout_checkbox: {
          value: true,
          isIndeterminate: false,
        },
        blowout_location: {
          value: 'trashId',
          isIndeterminate: false,
        },
      })
    })
  })
  describe('when fields are indeterminate', () => {
    let mockSavedStepFormsIndeterminate
    beforeEach(() => {
      mockSavedStepFormsIndeterminate = {
        ...getMockMoveLiquidStep(),
        // just doing this so the ids are not the exact same
        another_move_liquid_step_id: {
          ...getMockMoveLiquidStep().move_liquid_step_id,
          aspirate_flowRate: 2,
          aspirate_mmFromBottom: '2',
          aspirate_wellOrder_first: 'b2t',
          aspirate_wellOrder_second: 'r2l',
          preWetTip: true,
          aspirate_mix_checkbox: false,
          // not going to change mix times or mix volumes
          // if the checkboxes are different the rest of the fields should also be indeterminate
          aspirate_delay_checkbox: false,
          // same thing here for delay seconds and mm from bottom
          aspirate_airGap_checkbox: false,
          // same thing here with air gap volume
          aspirate_touchTip_checkbox: false,
          // same thing with aspirate_touchTip_mmFromBottom
          dispense_flowRate: 2,
          dispense_mmFromBottom: '2',
          dispense_wellOrder_first: 'b2t',
          dispense_wellOrder_second: 'r2l',
          dispense_mix_checkbox: false,
          // same thing here with mix times or mix volumes
          dispense_delay_checkbox: false,
          // same thing here for delay seconds and mm from bottom
          dispense_airGap_checkbox: false,
          // same thing here with air gap volume
          dispense_touchTip_checkbox: false,
          // same thing with dispense_touchTip_mmFromBottom
          blowout_checkbox: false,
          // same thing here with blowout location
        },
      }
    })
    it('should return the fields with the indeterminate boolean', () => {
      expect(
        getMultiSelectFieldValues.resultFunc(
          mockSavedStepFormsIndeterminate,
          mockmultiSelectItemIds
        )
      ).toEqual({
        // aspirate settings
        aspirate_flowRate: {
          isIndeterminate: true,
        },
        aspirate_mmFromBottom: {
          isIndeterminate: true,
        },
        aspirate_wellOrder_first: {
          isIndeterminate: true,
        },
        aspirate_wellOrder_second: {
          isIndeterminate: true,
        },
        preWetTip: {
          isIndeterminate: true,
        },
        aspirate_mix_checkbox: {
          isIndeterminate: true,
        },
        aspirate_mix_times: {
          isIndeterminate: true,
        },
        aspirate_mix_volume: {
          isIndeterminate: true,
        },
        aspirate_delay_checkbox: {
          isIndeterminate: true,
        },
        aspirate_delay_seconds: {
          isIndeterminate: true,
        },
        aspirate_delay_mmFromBottom: {
          isIndeterminate: true,
        },
        aspirate_airGap_checkbox: {
          isIndeterminate: true,
        },
        aspirate_airGap_volume: {
          isIndeterminate: true,
        },
        aspirate_touchTip_checkbox: {
          isIndeterminate: true,
        },
        aspirate_touchTip_mmFromBottom: {
          isIndeterminate: true,
        },
        // dispense settings
        dispense_flowRate: {
          isIndeterminate: true,
        },
        dispense_mmFromBottom: {
          isIndeterminate: true,
        },
        dispense_wellOrder_first: {
          isIndeterminate: true,
        },
        dispense_wellOrder_second: {
          isIndeterminate: true,
        },
        dispense_mix_checkbox: {
          isIndeterminate: true,
        },
        dispense_mix_times: {
          isIndeterminate: true,
        },
        dispense_mix_volume: {
          isIndeterminate: true,
        },
        dispense_delay_checkbox: {
          isIndeterminate: true,
        },
        dispense_delay_seconds: {
          isIndeterminate: true,
        },
        dispense_delay_mmFromBottom: {
          isIndeterminate: true,
        },
        dispense_airGap_checkbox: {
          isIndeterminate: true,
        },
        dispense_airGap_volume: {
          isIndeterminate: true,
        },
        dispense_touchTip_checkbox: {
          isIndeterminate: true,
        },
        dispense_touchTip_mmFromBottom: {
          isIndeterminate: true,
        },
        blowout_checkbox: {
          isIndeterminate: true,
        },
        blowout_location: {
          isIndeterminate: true,
        },
      })
    })
  })
})

describe('getMultiSelectDisabledFields', () => {
  let mockSavedStepForms
  let mockmultiSelectItemIds

  beforeEach(() => {
    mockSavedStepForms = {
      ...getMockMoveLiquidStep(),
      // just doing this so the ids are not the exact same
      another_move_liquid_step_id: {
        ...getMockMoveLiquidStep().move_liquid_step_id,
      },
    }
    mockmultiSelectItemIds = [
      'move_liquid_step_id',
      'another_move_liquid_step_id',
    ]
  })
  it('should return null if any of the forms are not moveLiquid type', () => {
    const savedStepForms = {
      ...mockSavedStepForms,
      another_move_liquid_step_id: {
        ...mockSavedStepForms.another_move_liquid_step_id,
        stepType: 'notMoveLiquid',
      },
    }
    expect(
      getMultiSelectDisabledFields.resultFunc(
        savedStepForms,
        mockmultiSelectItemIds
      )
    ).toBe(null)
  })
  it('should return an empty object when no fields are different and path is single', () => {
    expect(
      getMultiSelectDisabledFields.resultFunc(
        mockSavedStepForms,
        mockmultiSelectItemIds
      )
    ).toEqual({})
  })

  describe('disabled field tooltips', () => {
    it('should exist', () => {
      const baseText = 'tooltip.step_fields.batch_edit.disabled'
      const disabledReasons = [
        'pipette-different',
        'aspirate-labware-different',
        'dispense-labware-different',
        'multi-aspirate-present',
        'multi-aspirate-present-pipette-different',
        'multi-dispense-present',
        'multi-dispense-present-pipette-different',
      ]

      expect.assertions(7)
      disabledReasons.forEach(reason => {
        const searchText = `${baseText}.${reason}`
        expect(i18n.t(`${baseText}.${reason}`) !== searchText).toBe(true)
      })
    })
  })

  describe('when pipettes are different', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          pipette: 'different_pipette_id',
        },
      }
    })
    it('should return fields being disabled with associated reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        aspirate_mix_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        aspirate_mix_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        aspirate_mix_times: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        aspirate_flowRate: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        aspirate_airGap_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        aspirate_airGap_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_mix_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_mix_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_mix_times: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_flowRate: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_airGap_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
        dispense_airGap_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.pipette-different'
        ),
      })
    })
  })
  describe('when aspirate labware are different', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          aspirate_labware: 'different_aspirate_labware',
        },
      }
    })
    it('should return fields being disabled with associated reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        aspirate_mmFromBottom: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.aspirate-labware-different'
        ),
        aspirate_delay_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.aspirate-labware-different'
        ),
        aspirate_delay_seconds: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.aspirate-labware-different'
        ),
        aspirate_delay_mmFromBottom: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.aspirate-labware-different'
        ),
      })
    })
  })
  describe('when dispense labware are different', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          dispense_labware: 'different_dispense_labware',
        },
      }
    })
    it('should return fields being disabled with associated reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        dispense_mmFromBottom: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.dispense-labware-different'
        ),
        dispense_delay_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.dispense-labware-different'
        ),
        dispense_delay_seconds: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.dispense-labware-different'
        ),
        dispense_delay_mmFromBottom: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.dispense-labware-different'
        ),
      })
    })
  })
  describe('when a form includes a multi aspirate path', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          path: 'multiAspirate',
        },
      }
    })
    it('should return fields being disabled with associated reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        aspirate_mix_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present'
        ),
        aspirate_mix_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present'
        ),
        aspirate_mix_times: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present'
        ),
      })
    })
  })
  describe('when a form includes a multi dispense path', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          path: 'multiDispense',
        },
      }
    })
    it('should return fields being disabled with associated reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual({
        dispense_mix_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-dispense-present'
        ),
        dispense_mix_volume: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-dispense-present'
        ),
        dispense_mix_times: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-dispense-present'
        ),
        blowout_checkbox: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-dispense-present'
        ),
        blowout_location: i18n.t(
          'tooltip.step_fields.batch_edit.disabled.multi-dispense-present'
        ),
      })
    })
  })
  describe('when pipettes are different AND a form includes a multi aspirate path', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          path: 'multiAspirate',
          pipette: 'different_pipette_id',
        },
      }
    })
    it('should return aspirate mix being disabled for both reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual(
        expect.objectContaining({
          aspirate_mix_checkbox: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present-pipette-different'
          ),
          aspirate_mix_volume: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present-pipette-different'
          ),
          aspirate_mix_times: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-aspirate-present-pipette-different'
          ),
        })
      )
    })
  })
  describe('when pipettes are different AND a form includes a multi dispense path', () => {
    let savedStepForms
    beforeEach(() => {
      savedStepForms = {
        ...mockSavedStepForms,
        another_move_liquid_step_id: {
          ...mockSavedStepForms.another_move_liquid_step_id,
          path: 'multiDispense',
          pipette: 'different_pipette_id',
        },
      }
    })
    it('should return aspirate mix being disabled for both reasons', () => {
      expect(
        getMultiSelectDisabledFields.resultFunc(
          savedStepForms,
          mockmultiSelectItemIds
        )
      ).toEqual(
        expect.objectContaining({
          dispense_mix_checkbox: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-dispense-present-pipette-different'
          ),
          dispense_mix_volume: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-dispense-present-pipette-different'
          ),
          dispense_mix_times: i18n.t(
            'tooltip.step_fields.batch_edit.disabled.multi-dispense-present-pipette-different'
          ),
        })
      )
    })
  })
})

describe('getCountPerStepType', () => {
  it('should return an object representing counts of all selected step types', () => {
    const multiSelectItemIds = ['a', 'b', 'd']
    const savedStepForms = {
      a: { stepType: 'magnet' },
      b: { stepType: 'magnet' },
      c: { stepType: 'mix' }, // not selected! 'mix' should not show in result
      d: { stepType: 'moveLiquid' },
    }
    const result = getCountPerStepType.resultFunc(
      multiSelectItemIds,
      savedStepForms
    )
    expect(result).toEqual({ magnet: 2, moveLiquid: 1 })
  })

  it('should return an empty object when not in multi-select mode', () => {
    const result = getCountPerStepType.resultFunc(null, {})
    expect(result).toEqual({})
  })

  it('should return an empty object when no steps are multi-selected', () => {
    const result = getCountPerStepType.resultFunc([], {})
    expect(result).toEqual({})
  })
})

describe('getBatchEditSelectedStepTypes', () => {
  it('should return a sorted array of selected step types that are in the multi-selection', () => {
    const result = getBatchEditSelectedStepTypes.resultFunc({
      magnet: 1,
      mix: 3,
      moveLiquid: 0,
    })
    expect(result).toEqual(['magnet', 'mix'])
  })

  it('should return an empty array when no steps are multi-selected', () => {
    const result = getBatchEditSelectedStepTypes.resultFunc({})
    expect(result).toEqual([])
  })
})
