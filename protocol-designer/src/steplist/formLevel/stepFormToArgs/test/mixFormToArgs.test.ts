import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { getLabwareDefURI } from '@opentrons/shared-data'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import { fixture_96_plate } from '@opentrons/shared-data/labware/fixtures/2'
import { mixFormToArgs } from '../mixFormToArgs'
import { DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP } from '../../../../constants'
import { getOrderedWells } from '../../../utils'
import type { HydratedMixFormDataLegacy } from '../../../../form-types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../utils')

let hydratedForm: HydratedMixFormDataLegacy
const labwareDef = fixture_96_plate as LabwareDefinition2
const labwareType = getLabwareDefURI(labwareDef)

beforeEach(() => {
  vi.mocked(getOrderedWells).mockImplementation(wells => wells)

  hydratedForm = {
    id: 'stepId',
    stepType: 'mix',
    stepName: 'mix',
    stepDetails: '',
    changeTip: 'always',
    labware: {
      id: 'labwareId',
      // @ts-expect-error(sa, 2021-6-15): type does not exist on LabwareEntity
      type: labwareType,
      def: labwareDef,
    },
    mix_wellOrder_first: 'l2r',
    mix_wellOrder_second: 't2b',
    blowout_checkbox: false,
    blowout_location: null,
    mix_mmFromBottom: 0.5,
    // @ts-expect-error(sa, 2021-6-15): not a valid PipetteEntity
    pipette: {
      id: 'pipetteId',
      spec: fixtureP10Single,
    },
    // @ts-expect-error(sa, 2021-6-15): volume should be a number
    volume: '12',
    wells: ['A1', 'A2'],
    // @ts-expect-error(sa, 2021-6-15): times should be a number
    times: '2',
    dispense_flowRate: 4,
    mix_touchTip_checkbox: false,
    mix_touchTip_mmFromBottom: null,
    aspirate_delay_checkbox: false,
    aspirate_delay_seconds: null,
    dispense_delay_checkbox: false,
    dispense_delay_seconds: null,
  }
})

afterEach(() => {
  vi.resetAllMocks()
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
      formFields: { blowout_location: 'fixedTrash' },
      expectedArgsUnchecked: {
        blowoutLocation: null,
        blowoutOffsetFromTopMm: 0,
      },
      expectedArgsChecked: {
        blowoutLocation: 'fixedTrash',
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
      },
      expectedArgsUnchecked: {
        aspirateDelaySeconds: null,
      },
      expectedArgsChecked: {
        aspirateDelaySeconds: 15,
      },
    },
    // Dispense delay
    {
      checkboxField: 'dispense_delay_checkbox',
      formFields: {
        dispense_delay_seconds: 15,
      },
      expectedArgsUnchecked: {
        dispenseDelaySeconds: null,
      },
      expectedArgsChecked: {
        dispenseDelaySeconds: 15,
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
