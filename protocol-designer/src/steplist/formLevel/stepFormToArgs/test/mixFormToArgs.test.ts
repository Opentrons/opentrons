import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixtureP10SingleV2Specs,
  getLabwareDefURI,
} from '@opentrons/shared-data'
import { fixture_96_plate } from '@opentrons/shared-data/labware/fixtures/2'
import { AUTOMATIC } from '@opentrons/step-generation'

import { DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP } from '/protocol-designer/constants'

import { getOrderedWells } from '../../../utils'
import { mixFormToArgs } from '../mixFormToArgs'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { HydratedMixFormData } from '/protocol-designer/form-types'
import type { GetCastFormData } from '/protocol-designer/steplist/fieldLevel'

vi.mock('../../../utils')

let castForm: GetCastFormData<HydratedMixFormData>
const labwareDef = fixture_96_plate as LabwareDefinition2
const labwareType = getLabwareDefURI(labwareDef)

beforeEach(() => {
  vi.mocked(getOrderedWells).mockImplementation(wells => wells)

  const tiprackLabwareDef = {
    parameters: {
      tipLength: 10,
      loadName: 'mockTiprack',
    },
    metadata: {
      displayName: 'mock display name',
    },
  } as LabwareDefinition2

  castForm = {
    id: 'stepId',
    stepType: 'mix',
    stepName: 'Cool Mix Step',
    stepDetails: 'Here we mix 2 wells',
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
    tipRack: { tiprackDefURI: 'mockTiprack', ...tiprackLabwareDef },
    pipette: {
      id: 'pipetteId',
      spec: fixtureP10SingleV2Specs,
      tiprackLabwareDef: [tiprackLabwareDef] as any,
    } as any,
    // @ts-expect-error(sa, 2021-6-15): volume should be a number
    volume: '12',
    wells: ['A1', 'A2'],
    // @ts-expect-error(sa, 2021-6-15): times should be a number
    times: '2',
    dispense_flowRate: 4,
    mix_touchTip_checkbox: false,
    mix_touchTip_mmFromTop: null,
    aspirate_delay_checkbox: false,
    // @ts-expect-error - todo(mm, 2025-10-09): According to recently improved type hints, this should be a number.
    // Clarify the expected input and change this to a number if it's safe.
    aspirate_delay_seconds: null,
    dispense_delay_checkbox: false,
    // @ts-expect-error - todo(mm, 2025-10-09): According to recently improved type hints, this should be a number.
    // Clarify the expected input and change this to a number if it's safe.
    dispense_delay_seconds: null,
    tip_tracking: AUTOMATIC,
    tips_selected: [],
    tiprack_selected: null,
  }
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('mix step form -> command creator args', () => {
  it('mixFormToArgs propagates form fields to MixStepArgs', () => {
    const args = mixFormToArgs(castForm)
    expect(args).toMatchObject({
      commandCreatorFnName: 'mix',
      name: 'Cool Mix Step', // make sure name and description are present
      description: 'Here we mix 2 wells',
      labware: 'labwareId',
      wells: ['A1', 'A2'],
      volume: '12',
      times: '2',
      touchTip: false,
      touchTipMmFromTop: -1,
      changeTip: 'always',
      blowoutLocation: null,
      pipette: 'pipetteId',
      aspirateFlowRateUlSec: 5, // make sure flow rates are numbers instead of strings
      dispenseFlowRateUlSec: 4,
      blowoutFlowRateUlSec: 1000,
      offsetFromBottomMm: 0.5,
      blowoutOffsetFromTopMm: 0,
      aspirateDelaySeconds: null,
      tipRack: 'mockTiprack',
      dispenseDelaySeconds: null,
      dropTipLocation: undefined,
      nozzles: undefined,
      xOffset: 0,
      yOffset: 0,
      tipTracking: AUTOMATIC,
      tipsSelected: [],
      tiprackSelected: null,
    })
  })

  it('mixFormToArgs calls getOrderedWells correctly', () => {
    mixFormToArgs(castForm)

    expect(getOrderedWells).toHaveBeenCalledTimes(1)
    expect(getOrderedWells).toHaveBeenCalledWith(
      castForm.wells,
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
      formFields: { mix_touchTip_mmFromTop: -10.5 },
      expectedArgsUnchecked: {
        touchTip: false,
        touchTipMmFromTop: -10.5,
      },
      expectedArgsChecked: {
        touchTip: true,
        touchTipMmFromTop: -10.5,
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
            ...castForm,
            [checkboxField]: false,
            ...formFields,
          })
        ).toMatchObject(expectedArgsUnchecked)

        expect(
          mixFormToArgs({
            ...castForm,
            [checkboxField]: true,
            ...formFields,
          })
        ).toMatchObject(expectedArgsChecked)
      })
    }
  )
})
