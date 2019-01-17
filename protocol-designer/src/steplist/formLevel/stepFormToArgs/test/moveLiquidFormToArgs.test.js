// @flow
import moveLiquidFormToArgs, {
  getMixData,
  type HydratedMoveLiquidFormData,
} from '../moveLiquidFormToArgs'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../../../step-generation/utils'
import {getOrderedWells} from '../../../utils'
jest.mock('../../../utils')

describe('move liquid step form -> command creator args', () => {
  let hydratedForm: ?HydratedMoveLiquidFormData = null
  const sourceLabwareType = '96-flat'
  const destLabwareType = '96-deep-well'
  beforeEach(() => {
    // $FlowFixMe: mock methods
    getOrderedWells.mockClear()
    // $FlowFixMe: mock methods
    getOrderedWells.mockImplementation((wells) => wells)

    // the "base case" is a 1 to 1 transfer, single path
    hydratedForm = {
      stepType: 'moveLiquid',
      stepName: 'Test Step',
      description: null,

      fields: {
        pipette: {id: 'pipetteId'},
        volume: 10,
        path: 'single',
        changeTip: 'always',
        aspirate_labware: {id: 'sourceLabwareId', type: sourceLabwareType},
        aspirate_wells: ['B1'],
        aspirate_wellOrder_first: 'l2r',
        aspirate_wellOrder_second: 't2b',
        aspirate_flowRate: null,
        aspirate_mmFromBottom: null,
        aspirate_touchTip_checkbox: false,
        aspirate_touchTip_mmFromBottom: null,
        aspirate_mix_checkbox: false,
        aspirate_mix_volume: null,
        aspirate_mix_times: null,

        dispense_labware: {id: 'destLabwareId', type: destLabwareType},
        dispense_wells: ['B2'],
        dispense_wellOrder_first: 'r2l',
        dispense_wellOrder_second: 'b2t',
        dispense_flowRate: null,
        dispense_mmFromBottom: null,
        dispense_touchTip_checkbox: false,
        dispense_touchTip_mmFromBottom: null,
        dispense_mix_checkbox: false,
        dispense_mix_volume: null,
        dispense_mix_times: null,

        aspirate_wells_grouped: false,
        preWetTip: false,
        disposalVolume_checkbox: false,
        disposalVolume_volume: null,
        disposalVolume_location: null,
        blowout_checkbox: false,
        blowout_location: null,
      },
    }
  })

  test('moveLiquidFormToArgs calls getOrderedWells correctly', () => {
    moveLiquidFormToArgs(hydratedForm)

    expect(getOrderedWells).toHaveBeenCalledTimes(2)
    expect(getOrderedWells).toHaveBeenCalledWith(
      ['B1'], sourceLabwareType, 'l2r', 't2b')
    expect(getOrderedWells).toHaveBeenCalledWith(
      ['B2'], destLabwareType, 'r2l', 'b2t')
  })

  test('moveLiquid form with 1:1 single transfer translated to args', () => {
    const result = moveLiquidFormToArgs(hydratedForm)

    expect(result).toMatchObject({
      pipette: 'pipetteId',
      volume: 10,
      changeTip: 'always',
      sourceLabware: 'sourceLabwareId',
      sourceWells: ['B1'],
      destLabware: 'destLabwareId',
      destWells: ['B2'],
    })

    // no form-specific fields should be passed along
    Object.keys(result).forEach(field => {
      expect(field).toEqual(expect.not.stringMatching(/.*wellOrder.*/i))
      expect(field).toEqual(expect.not.stringMatching(/.*checkbox.*/i))
    })
  })

  const checkboxFieldCases = [
    {
      checkboxField: 'aspirate_touchTip_checkbox',
      formFields: {aspirate_touchTip_mmFromBottom: 42},
      expectedArgsUnchecked: {
        touchTipAfterAspirate: false,
        touchTipAfterAspirateOffsetMmFromBottom: null,
      },
      expectedArgsChecked: {
        touchTipAfterAspirate: true,
        touchTipAfterAspirateOffsetMmFromBottom: 42,
      },
    },

    {
      checkboxField: 'dispense_touchTip_checkbox',
      formFields: {dispense_touchTip_mmFromBottom: 42},
      expectedArgsUnchecked: {
        touchTipAfterDispense: false,
        touchTipAfterDispenseOffsetMmFromBottom: null,
      },
      expectedArgsChecked: {
        touchTipAfterDispense: true,
        touchTipAfterDispenseOffsetMmFromBottom: 42,
      },
    },
  ]

  checkboxFieldCases.forEach(({checkboxField, formFields, expectedArgsChecked, expectedArgsUnchecked}) => {
    test(`${checkboxField} toggles dependent fields`, () => {
      expect(moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          [checkboxField]: false,
          ...formFields,
        },
      })).toMatchObject(expectedArgsUnchecked)

      expect(moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          [checkboxField]: true,
          ...formFields,
        },
      })).toMatchObject(expectedArgsChecked)
    })
  })

  describe('distribute: disposal volume / blowout behaviors', () => {
    const blowoutLabwareId = 'blowoutLabwareId'
    const disposalVolumeFields = {
      path: 'multiDispense', // 'multiDispense' required to use `distribute` command creator
      blowout_location: blowoutLabwareId, // disposal volume uses `blowout_location` for the blowout
      disposalVolume_volume: 123,
      // NOTE: when spreading these in to hydratedForm fixture,
      // remember the blowout/disposalVolume checkboxes are false by default!
    }

    test('disposal volume works when checkbox true', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          disposalVolume_checkbox: true,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: 123,
        disposalLabware: blowoutLabwareId,
        disposalWell: 'A1',
      })
    })

    test('disposal volume fields ignored when checkbox false', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          disposalVolume_checkbox: false,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: null,
        disposalLabware: null,
        disposalWell: null,
      })
    })

    test('disposal volume overrides blowout', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          disposalVolume_checkbox: true,
          blowout_checkbox: true,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: 123,
        disposalLabware: blowoutLabwareId,
        disposalWell: 'A1',
      })
    })

    test('fallback to blowout when disposal volume unchecked', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          disposalVolume_checkbox: false,
          blowout_checkbox: true,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: null,
        disposalLabware: blowoutLabwareId,
        disposalWell: 'A1',
      })
    })

    test('blowout in source', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          blowout_checkbox: true,
          blowout_location: SOURCE_WELL_BLOWOUT_DESTINATION,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: null,
        disposalLabware: 'sourceLabwareId',
        disposalWell: 'B1',
      })
    })

    test('blowout in dest', () => {
      const result = moveLiquidFormToArgs({
        ...hydratedForm,
        fields: {
          ...hydratedForm.fields,
          ...disposalVolumeFields,
          blowout_checkbox: true,
          blowout_location: DEST_WELL_BLOWOUT_DESTINATION,
        },
      })

      expect(result).toMatchObject({
        disposalVolume: null,
        disposalLabware: 'destLabwareId',
        disposalWell: 'B2',
      })
    })
  })
})

describe('getMixData', () => {
  test('return null if checkbox field is false', () => {
    expect(getMixData(
      {checkboxField: false, volumeField: 30, timesField: 2},
      'checkboxField', 'volumeField', 'timesField'
    )).toBe(null)
  })

  test('return null if either number fields <= 0 / null', () => {
    const cases = [[0, 5], [null, 5], [10, 0], [10, null]]

    cases.forEach(testCase => {
      const [volumeValue, timesValue] = testCase
      expect(getMixData(
        {checkboxField: true, volumeField: volumeValue, timesField: timesValue},
        'checkboxField', 'volumeField', 'timesField'
      )).toBe(null)
    })
  })

  test('return volume & times if checkbox is checked', () => {
    expect(getMixData(
      {checkboxField: true, volumeField: 30, timesField: 2},
      'checkboxField', 'volumeField', 'timesField'
    )).toEqual({volume: 30, times: 2})
  })
})
