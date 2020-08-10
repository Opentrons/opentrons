// @flow
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { getPrereleaseFeatureFlag } from '../../../../persist'
import {
  dependentFieldsUpdateMoveLiquid,
  updatePatchBlowoutFields,
} from '../dependentFieldsUpdateMoveLiquid'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../../../../step-generation'

let pipetteEntities
let labwareEntities
let handleFormHelper

jest.mock('../../../../persist')

const mockGetPrereleaseFeatureFlag: JestMockFn<
  string,
  boolean
> = getPrereleaseFeatureFlag

beforeEach(() => {
  mockGetPrereleaseFeatureFlag.mockImplementation(
    ff => ff === 'OT_PD_ENABLE_AIR_GAP_AND_DELAY'
  )

  pipetteEntities = {
    pipetteId: {
      name: 'p10_single',
      spec: fixtureP10Single,
      tiprackModel: 'tiprack-10ul',
      tiprackLabwareDef: fixture_tiprack_10_ul,
    },
    otherPipetteId: {
      name: 'p300_single_gen2',
      spec: fixtureP300Single,
      tiprackModel: 'tiprack-300ul',
      tiprackLabwareDef: fixture_tiprack_300_ul,
    },
  }
  labwareEntities = {}
  handleFormHelper = (patch, baseForm) =>
    dependentFieldsUpdateMoveLiquid(
      patch,
      baseForm,
      pipetteEntities,
      labwareEntities
    )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('no-op cases should pass through the patch unchanged', () => {
  const minimalBaseForm = {
    blah: 'blaaah',
    // NOTE: without these fields below, `path` gets added to the result
    path: 'single',
    aspirate_wells: ['A1'],
    dispense_wells: ['B1'],
  }

  it('empty patch', () => {
    const patch = {}
    expect(handleFormHelper(patch, minimalBaseForm)).toBe(patch)
  })
  it('patch with unhandled field', () => {
    const patch = { fooField: 123 }
    expect(handleFormHelper(patch, minimalBaseForm)).toBe(patch)
  })
})

describe('path should update...', () => {
  it('if there is no path in base form', () => {
    const patch = {}
    expect(handleFormHelper(patch, { blah: 'blaaah' })).toEqual({
      path: 'single',
    })
  })
  describe('if path is multi and volume*2 exceeds pipette/tip capacity', () => {
    const multiPaths = ['multiAspirate', 'multiDispense']
    multiPaths.forEach(path => {
      it(`path ${path} → single`, () => {
        // volume is updated, existing path was multi
        // NOTE: 6 exceeds multi-well capacity of P10 (cannot fit 2 wells)
        const result2 = handleFormHelper(
          { volume: '6' },
          {
            path,
            volume: '1',
            pipette: 'pipetteId',
          }
        )
        expect(result2).toMatchObject({ path: 'single', volume: '6' })
      })
    })
  })

  describe('if new changeTip option is incompatible...', () => {
    // cases are: [changeTip, pathThatIsIncompatibleWithChangeTip]
    const cases = [['perSource', 'multiAspirate'], ['perDest', 'multiDispense']]

    cases.forEach(([changeTip, badPath]) => {
      it(`"${changeTip}" selected: path → single`, () => {
        const patch = { changeTip }
        const result = handleFormHelper({ ...patch, path: badPath }, {})
        expect(result.path).toEqual('single')
      })
    })
  })
})

describe('disposal volume should update...', () => {
  let form
  beforeEach(() => {
    form = {
      path: 'multiDispense',
      aspirate_wells: ['A1'],
      dispense_wells: ['B2', 'B3'],
      volume: '2',
      pipette: 'pipetteId',
      disposalVolume_checkbox: true,
      disposalVolume_volume: '1.1',
    }
  })

  describe('should not remove valid decimal', () => {
    const testCases = ['.', '0.', '.1', '1.', '']
    testCases.forEach(disposalVolume_volume => {
      it(`input is ${disposalVolume_volume}`, () => {
        const result = handleFormHelper({ disposalVolume_volume }, form)
        expect(result.disposalVolume_volume).toBe(disposalVolume_volume)
      })
    })
  })

  it('when path is changed: multiDispense → single', () => {
    const result = handleFormHelper({ path: 'single' }, form)
    expect(result).toEqual({
      path: 'single',
      disposalVolume_checkbox: false,
      disposalVolume_volume: null,
    })
  })

  it('when volume is raised but disposal vol is still in capacity, do not change (noop case)', () => {
    const patch = { volume: '2.5' }
    const result = handleFormHelper(patch, form)
    expect(result).toEqual(patch)
  })

  describe('when volume is raised so that disposal vol must be exactly zero, clear/zero disposal volume fields', () => {
    const volume = '5' // 5 + 5 = 10 which is P10 capacity ==> max disposal volume is zero
    it('when form is newly changed to multiDispense: clear the disposal vol + dispense_mix_* fields', () => {
      const patch = { path: 'multiDispense' }
      const result = handleFormHelper(patch, {
        ...form,
        path: 'single',
        volume,
      })
      expect(result).toEqual({
        ...patch,
        disposalVolume_volume: null,
        disposalVolume_checkbox: false,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
      })
    })

    it('when form was multiDispense already: set to zero', () => {
      const patch = { volume }
      const result = handleFormHelper(patch, form)
      expect(result).toEqual({
        ...patch,
        disposalVolume_volume: '0',
      })
    })
  })

  it('when volume is raised past disposal volume, lower disposal volume', () => {
    const result = handleFormHelper({ volume: '4.6' }, form)
    expect(result).toEqual({
      volume: '4.6',
      disposalVolume_volume: '0.8',
    })
  })

  it('clamp excessive disposal volume to max', () => {
    const result = handleFormHelper({ disposalVolume_volume: '9999' }, form)
    expect(result).toEqual({ disposalVolume_volume: '6' })
  })

  it('when disposal volume is a negative number, set to zero', () => {
    const result = handleFormHelper({ disposalVolume_volume: '-2' }, form)
    expect(result).toEqual({ disposalVolume_volume: '0' })
  })

  describe('mix fields should clear...', () => {
    // NOTE: path --> multiDispense handled in "when form is newly changed to multiDispense" test above

    it('when path is changed to multiAspirate, clear aspirate mix fields', () => {
      const form = {
        path: 'single',
        aspirate_wells: ['A1', 'A2'],
        dispense_wells: ['B1'],
        volume: 3,
        pipette: 'pipetteId',
        aspirate_mix_checkbox: true,
        aspirate_mix_times: 2,
        aspirate_mix_volume: 1,
      }
      const result = handleFormHelper({ path: 'multiAspirate' }, form)
      expect(result).toEqual({
        path: 'multiAspirate',
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
      })
    })
  })

  describe('blowout location should reset via updatePatchBlowoutFields...', () => {
    const resetBlowoutLocation = {
      blowout_location: 'trashId',
    }

    const testCases = [
      {
        prevPath: 'single',
        nextPath: 'multiAspirate',
        incompatible: SOURCE_WELL_BLOWOUT_DESTINATION,
      },
      {
        prevPath: 'single',
        nextPath: 'multiDispense',
        incompatible: DEST_WELL_BLOWOUT_DESTINATION,
      },
    ]

    testCases.forEach(({ prevPath, nextPath, incompatible }) => {
      const patch = { path: nextPath }
      it(`when changing path ${prevPath} → ${nextPath}, arbitrary labware still allowed`, () => {
        const result = updatePatchBlowoutFields(patch, {
          path: prevPath,
          blowout_location: 'someKindaTrashLabwareIdHere',
        })
        expect(result).toEqual(patch)
      })

      it(`when changing path ${prevPath} → ${nextPath}, ${incompatible} reset to trashId`, () => {
        const result = updatePatchBlowoutFields(patch, {
          path: prevPath,
          blowout_location: incompatible,
        })
        expect(result).toEqual({ ...patch, ...resetBlowoutLocation })
      })
    })
  })
})

describe('air gap volume', () => {
  describe('when the path is single', () => {
    let form
    beforeEach(() => {
      form = {
        path: 'single',
        aspirate_wells: ['A1'],
        dispense_wells: ['B2'],
        volume: '2',
        pipette: 'pipetteId',
        disposalVolume_checkbox: true,
        disposalVolume_volume: '1.1',
      }
    })

    it('should update the air gap volume to 0 when the patch volume is less than 0', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '-1' }, form)
      expect(result.aspirate_airGap_volume).toEqual('0')
    })
    it('should update the air gap volume to 0 when the raw form volume is less than 0', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '-1' }
      )
      expect(result.aspirate_airGap_volume).toEqual('0')
    })
    it('should update the air gap volume to the pipette capacity - min pipette volume when the patch air gap volume is too big', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '100' }, form)
      expect(result.aspirate_airGap_volume).toEqual('9')
    })
    it('should update the air gap volume to the pipette capacity - min pipette volume when the raw form air gap volume is too big', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '9' }
      )
      expect(result.aspirate_airGap_volume).toEqual('9')
    })
    it('should NOT update when the patch volume is greater than the min pipette volume', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '2' }, form)
      expect(result.aspirate_airGap_volume).toEqual('2')
    })
    it('should NOT update when the raw form volume is greater than the min pipette volume', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '2' }
      )
      expect(result.aspirate_airGap_volume).toEqual('2')
    })
    it('should NOT update when the patch volume is equal to the min pipette volume', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '1' }, form)
      expect(result.aspirate_airGap_volume).toEqual('1')
    })
    it('should NOT update when the raw form volume is equal to the min pipette volume', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '1' }
      )
      expect(result.aspirate_airGap_volume).toEqual('1')
    })
  })

  describe('when the path is multi aspirate', () => {
    let form
    beforeEach(() => {
      form = {
        path: 'multiAspirate',
        aspirate_wells: ['A1', 'B1'],
        dispense_wells: ['B2'],
        volume: '2',
        pipette: 'pipetteId',
        disposalVolume_checkbox: true,
        disposalVolume_volume: '1.1',
      }
    })

    it('should update the air gap volume to 0 when the patch volume is less than 0', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '-1' }, form)
      expect(result.aspirate_airGap_volume).toEqual('0')
    })
    it('should update the air gap volume to 0 when the raw form volume is less than 0', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '-1' }
      )
      expect(result.aspirate_airGap_volume).toEqual('0')
    })
    it('should update the air gap volume to the pipette capacity - min pipette volume when the air gap volume is too big', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '100' }, form)
      expect(result.aspirate_airGap_volume).toEqual('9')
    })
    it('should update the air gap volume to the pipette capacity - min pipette volume when the raw form air gap volume is too big', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '9' }
      )
      expect(result.aspirate_airGap_volume).toEqual('9')
    })
    it('should NOT update when the patch volume is greater than the min pipette volume', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '2' }, form)
      expect(result.aspirate_airGap_volume).toEqual('2')
    })
    it('should NOT update when the raw form volume is greater than the min pipette volume', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '2' }
      )
      expect(result.aspirate_airGap_volume).toEqual('2')
    })
    it('should NOT update when the patch volume is equal to the min pipette volume', () => {
      const result = handleFormHelper({ aspirate_airGap_volume: '1' }, form)
      expect(result.aspirate_airGap_volume).toEqual('1')
    })
    it('should NOT update when the raw form volume is equal to the min pipette volume', () => {
      const result = handleFormHelper(
        {},
        { ...form, aspirate_airGap_volume: '1' }
      )
      expect(result.aspirate_airGap_volume).toEqual('1')
    })
  })
  describe('when the path is multi dispense', () => {
    const form = {
      path: 'multiDispense',
      aspirate_wells: ['A1'],
      dispense_wells: ['B2', 'B3'],
      volume: '2',
      pipette: 'pipetteId',
      disposalVolume_checkbox: true,
      disposalVolume_volume: '1.1',
      aspirate_airGap_checkbox: false,
      aspirate_airGap_volume: null,
    }
    it('should reset to pipette min when pipette is changed', () => {
      const result = handleFormHelper({ pipette: 'otherPipetteId' }, form)
      expect(result).toMatchObject({ aspirate_airGap_volume: '30' })
    })
  })
})
