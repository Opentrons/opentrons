// @flow
import { getLabwareDefURI } from '@opentrons/shared-data'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import {
  moveLiquidFormToArgs,
  getAirGapData,
  getMixData,
  type HydratedMoveLiquidFormData,
} from '../moveLiquidFormToArgs'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../../../step-generation/utils'
import { getOrderedWells } from '../../../utils'
jest.mock('../../../utils')

const ASPIRATE_WELL = 'A2' // default source is trough for these tests
const DISPENSE_WELL = 'C3' // default dest in 96 flat for these tests

describe('move liquid step form -> command creator args', () => {
  let hydratedForm: ?HydratedMoveLiquidFormData = null
  const sourceLabwareDef = fixture_12_trough
  const sourceLabwareType = getLabwareDefURI(sourceLabwareDef)
  const destLabwareDef = fixture_96_plate
  const destLabwareType = getLabwareDefURI(destLabwareDef)
  beforeEach(() => {
    // $FlowFixMe: mock methods
    getOrderedWells.mockClear()
    // $FlowFixMe: mock methods
    getOrderedWells.mockImplementation(wells => wells)

    // the "base case" is a 1 to 1 transfer, single path
    hydratedForm = {
      stepType: 'moveLiquid',
      stepName: 'Test Step',
      description: null,

      fields: {
        pipette: {
          id: 'pipetteId',
          spec: fixtureP10Single,
        },
        volume: 10,
        path: 'single',
        changeTip: 'always',
        aspirate_labware: {
          id: 'sourceLabwareId',
          type: sourceLabwareType,
          def: sourceLabwareDef,
        },
        aspirate_wells: [ASPIRATE_WELL],
        aspirate_wellOrder_first: 'l2r',
        aspirate_wellOrder_second: 't2b',
        aspirate_flowRate: null,
        aspirate_mmFromBottom: null,
        aspirate_touchTip_checkbox: false,
        aspirate_touchTip_mmFromBottom: null,
        aspirate_mix_checkbox: false,
        aspirate_mix_volume: null,
        aspirate_mix_times: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: null,
        aspirate_delay_mmFromBottom: null,

        dispense_labware: {
          id: 'destLabwareId',
          type: destLabwareType,
          def: destLabwareDef,
        },
        dispense_wells: [DISPENSE_WELL],
        dispense_wellOrder_first: 'r2l',
        dispense_wellOrder_second: 'b2t',
        dispense_flowRate: null,
        dispense_mmFromBottom: null,
        dispense_touchTip_checkbox: false,
        dispense_touchTip_mmFromBottom: null,
        dispense_mix_checkbox: false,
        dispense_mix_volume: null,
        dispense_mix_times: null,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: null,
        dispense_delay_mmFromBottom: null,

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

  it('moveLiquidFormToArgs calls getOrderedWells correctly', () => {
    moveLiquidFormToArgs(hydratedForm)

    expect(getOrderedWells).toHaveBeenCalledTimes(2)
    expect(getOrderedWells).toHaveBeenCalledWith(
      [ASPIRATE_WELL],
      sourceLabwareDef,
      'l2r',
      't2b'
    )
    expect(getOrderedWells).toHaveBeenCalledWith(
      [DISPENSE_WELL],
      destLabwareDef,
      'r2l',
      'b2t'
    )
  })

  it('moveLiquid form with 1:1 single transfer translated to args', () => {
    const result = moveLiquidFormToArgs(hydratedForm)

    expect(result).toMatchObject({
      pipette: 'pipetteId',
      volume: 10,
      changeTip: 'always',
      sourceLabware: 'sourceLabwareId',
      sourceWells: [ASPIRATE_WELL],
      destLabware: 'destLabwareId',
      destWells: [DISPENSE_WELL],
    })

    // no form-specific fields should be passed along
    Object.keys(result).forEach(field => {
      expect(field).toEqual(expect.not.stringMatching(/.*wellOrder.*/i))
      expect(field).toEqual(expect.not.stringMatching(/.*checkbox.*/i))
    })
  })

  const checkboxFieldCases = [
    // TOUCH TIPS
    {
      checkboxField: 'aspirate_touchTip_checkbox',
      formFields: { aspirate_touchTip_mmFromBottom: 101 },
      expectedArgsUnchecked: {
        touchTipAfterAspirate: false,
        touchTipAfterAspirateOffsetMmFromBottom: 101,
      },
      expectedArgsChecked: {
        touchTipAfterAspirate: true,
        touchTipAfterAspirateOffsetMmFromBottom: 101,
      },
    },
    {
      checkboxField: 'dispense_touchTip_checkbox',
      formFields: { dispense_touchTip_mmFromBottom: 42 },
      expectedArgsUnchecked: {
        touchTipAfterDispense: false,
        touchTipAfterDispenseOffsetMmFromBottom: 42,
      },
      expectedArgsChecked: {
        touchTipAfterDispense: true,
        touchTipAfterDispenseOffsetMmFromBottom: 42,
      },
    },
    // MIXES
    {
      checkboxField: 'aspirate_mix_checkbox',
      formFields: {
        aspirate_mix_volume: 5,
        aspirate_mix_times: 3,
      },
      expectedArgsUnchecked: { mixBeforeAspirate: null },
      expectedArgsChecked: { mixBeforeAspirate: { volume: 5, times: 3 } },
    },
    {
      checkboxField: 'dispense_mix_checkbox',
      formFields: {
        dispense_mix_volume: 5,
        dispense_mix_times: 3,
      },
      expectedArgsUnchecked: { mixInDestination: null },
      expectedArgsChecked: { mixInDestination: { volume: 5, times: 3 } },
    },
    // DELAYS
    {
      checkboxField: 'aspirate_delay_checkbox',
      formFields: {
        aspirate_delay_seconds: 11,
        aspirate_delay_mmFromBottom: 12,
      },
      expectedArgsUnchecked: { aspirateDelay: null },
      expectedArgsChecked: { aspirateDelay: { seconds: 11, mmFromBottom: 12 } },
    },
    {
      checkboxField: 'dispense_delay_checkbox',
      formFields: {
        dispense_delay_seconds: 11,
        dispense_delay_mmFromBottom: 12,
      },
      expectedArgsUnchecked: { dispenseDelay: null },
      expectedArgsChecked: { dispenseDelay: { seconds: 11, mmFromBottom: 12 } },
    },
    // AIRGAP
    {
      checkboxField: 'aspirate_airGap_checkbox',
      formFields: {
        aspirate_airGap_volume: 20,
      },
      expectedArgsUnchecked: { aspirateAirGapVolume: null },
      expectedArgsChecked: { aspirateAirGapVolume: 20 },
    },
  ]

  checkboxFieldCases.forEach(
    ({
      checkboxField,
      formFields,
      expectedArgsChecked,
      expectedArgsUnchecked,
    }) => {
      it(`${checkboxField} toggles dependent fields`, () => {
        expect(
          moveLiquidFormToArgs({
            ...hydratedForm,
            fields: {
              ...hydratedForm.fields,
              [checkboxField]: false,
              ...formFields,
            },
          })
        ).toMatchObject(expectedArgsUnchecked)

        expect(
          moveLiquidFormToArgs({
            ...hydratedForm,
            fields: {
              ...hydratedForm.fields,
              [checkboxField]: true,
              ...formFields,
            },
          })
        ).toMatchObject(expectedArgsChecked)
      })
    }
  )

  describe('distribute: disposal volume / blowout behaviors', () => {
    const blowoutLabwareId = 'blowoutLabwareId'
    const disposalVolumeFields = {
      path: 'multiDispense', // 'multiDispense' required to use `distribute` command creator
      blowout_location: blowoutLabwareId, // disposal volume uses `blowout_location` for the blowout
      disposalVolume_volume: 123,
      // NOTE: when spreading these in to hydratedForm fixture,
      // remember the blowout/disposalVolume checkboxes are false by default!
    }

    it('disposal volume works when checkbox true', () => {
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

    it('disposal volume fields ignored when checkbox false', () => {
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

    it('disposal volume overrides blowout', () => {
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

    it('fallback to blowout when disposal volume unchecked', () => {
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

    it('blowout in source', () => {
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
        disposalWell: ASPIRATE_WELL,
      })
    })

    it('blowout in dest', () => {
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
        disposalWell: DISPENSE_WELL,
      })
    })
  })
})

describe('getMixData', () => {
  it('return null if checkbox field is false', () => {
    expect(
      getMixData(
        { checkboxField: false, volumeField: 30, timesField: 2 },
        'checkboxField',
        'volumeField',
        'timesField'
      )
    ).toBe(null)
  })

  it('return null if either number fields <= 0 / null', () => {
    const cases = [[0, 5], [null, 5], [10, 0], [10, null], [-1, 2], [2, -1]]

    cases.forEach(testCase => {
      const [volumeValue, timesValue] = testCase
      expect(
        getMixData(
          {
            checkboxField: true,
            volumeField: volumeValue,
            timesField: timesValue,
          },
          'checkboxField',
          'volumeField',
          'timesField'
        )
      ).toBe(null)
    })
  })

  it('return volume & times if checkbox is checked', () => {
    expect(
      getMixData(
        { checkboxField: true, volumeField: 30, timesField: 2 },
        'checkboxField',
        'volumeField',
        'timesField'
      )
    ).toEqual({ volume: 30, times: 2 })
  })
})

describe('getAirGapData', () => {
  it('should return null when the checkbox field is false', () => {
    expect(
      getAirGapData(
        { aspirate_airGap_checkbox: false, aspirate_airGap_volume: 20 },
        'aspirate_airGap_checkbox',
        'aspirate_airGap_volume'
      )
    ).toBe(null)
  })
  it('should return the air gap volume when the air gap checkbox is true', () => {
    expect(
      getAirGapData(
        { aspirate_airGap_checkbox: true, aspirate_airGap_volume: 20 },
        'aspirate_airGap_checkbox',
        'aspirate_airGap_volume'
      )
    ).toBe(20)
  })
})
