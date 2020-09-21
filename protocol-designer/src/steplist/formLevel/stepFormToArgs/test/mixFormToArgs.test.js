// @flow
import { getLabwareDefURI } from '@opentrons/shared-data'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { mixFormToArgs } from '../mixFormToArgs'
import { DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP } from '../../../../constants'
import { getOrderedWells } from '../../../utils'
jest.mock('../../../utils')

const getOrderedWellsMock: JestMockFn<any, Array<string>> = getOrderedWells

let hydratedForm
const labwareDef = fixture_96_plate
const labwareType = getLabwareDefURI(labwareDef)

beforeEach(() => {
  getOrderedWellsMock.mockImplementation(wells => wells)

  hydratedForm = {
    id: 'stepId',
    stepType: 'mix',
    stepName: 'mix',
    stepDetails: '',
    changeTip: 'always',
    labware: {
      id: 'labwareId',
      type: labwareType,
      def: labwareDef,
    },
    mix_wellOrder_first: 'l2r',
    mix_wellOrder_second: 't2b',
    blowout_checkbox: false,
    blowout_location: null,
    mix_mmFromBottom: '0.5',
    pipette: {
      id: 'pipetteId',
      spec: fixtureP10Single,
    },
    volume: '12',
    wells: ['A1', 'A2'],
    times: '2',
    dispense_flowRate: 4,
    mix_touchTip_checkbox: false,
    mix_touchTip_mmFromBottom: null,
    aspirate_delay_checkbox: false,
    aspirate_delay_seconds: null,
    mix_aspirate_delay_mmFromBottom: null,
    dispense_delay_checkbox: false,
    dispense_delay_seconds: null,
    mix_dispense_delay_mmFromBottom: null,
  }
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('mix step form -> command creator args', () => {
  it('mixFormToArgs calls getOrderedWells correctly', () => {
    mixFormToArgs(hydratedForm)

    expect(getOrderedWells).toHaveBeenCalledTimes(1)
    expect(getOrderedWells).toHaveBeenCalledWith(
      hydratedForm.wells,
      labwareDef,
      'l2r',
      't2b'
    )
  })

  const checkboxFieldCases = [
    // BLOWOUT
    {
      checkboxField: 'blowout_checkbox',
      formFields: { blowout_location: 'trashId' },
      expectedArgsUnchecked: {
        blowoutLocation: null,
        blowoutOffsetFromTopMm: 0,
      },
      expectedArgsChecked: {
        blowoutLocation: 'trashId',
        blowoutOffsetFromTopMm: DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
      },
    },
    // TOUCH TIP
    {
      checkboxField: 'mix_touchTip_checkbox',
      formFields: { mix_touchTip_mmFromBottom: 10.5 },
      expectedArgsUnchecked: {
        touchTip: false,
        touchTipMmFromBottom: 10.5,
      },
      expectedArgsChecked: {
        touchTip: true,
        touchTipMmFromBottom: 10.5,
      },
    },
    // Aspirate delay
    {
      checkboxField: 'aspirate_delay_checkbox',
      formFields: {
        aspirate_delay_seconds: 15,
        mix_aspirate_delay_mmFromBottom: 11.2,
      },
      expectedArgsUnchecked: {
        aspirateDelay: null,
      },
      expectedArgsChecked: {
        aspirateDelay: { seconds: 15, mmFromBottom: 11.2 },
      },
    },
    // Dispense delay
    {
      checkboxField: 'dispense_delay_checkbox',
      formFields: {
        dispense_delay_seconds: 15,
        mix_dispense_delay_mmFromBottom: 11.2,
      },
      expectedArgsUnchecked: {
        dispenseDelay: null,
      },
      expectedArgsChecked: {
        dispenseDelay: { seconds: 15, mmFromBottom: 11.2 },
      },
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
          mixFormToArgs({
            ...hydratedForm,
            [checkboxField]: false,
            ...formFields,
          })
        ).toMatchObject(expectedArgsUnchecked)

        expect(
          mixFormToArgs({
            ...hydratedForm,
            [checkboxField]: true,
            ...formFields,
          })
        ).toMatchObject(expectedArgsChecked)
      })
    }
  )
})
