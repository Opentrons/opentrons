import { describe, it, beforeEach, expect } from 'vitest'
import { fixture_24_tuberack } from '@opentrons/shared-data/labware/fixtures/2'
import {
  _minAirGapVolume,
  belowPipetteMinimumVolume,
  minDisposalVolume,
  maxDispenseWellVolume,
} from '../warnings'

type CheckboxFields = 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox'
type VolumeFields = 'aspirate_airGap_volume' | 'dispense_airGap_volume'
describe('Min air gap volume', () => {
  const aspDisp = ['aspirate', 'dispense']
  aspDisp.forEach(aspOrDisp => {
    const checkboxField = `${aspDisp}_airGap_checkbox` as CheckboxFields
    const volumeField = `${aspDisp}_airGap_volume` as VolumeFields

    describe(`${aspOrDisp} -> air gap`, () => {
      let pipette: { spec: { minVolume: number } }
      beforeEach(() => {
        pipette = {
          spec: {
            minVolume: 100,
          },
        }
      })

      const minAirGapVolume = _minAirGapVolume(checkboxField, volumeField)

      it('should NOT return a warning when the air gap checkbox is not selected', () => {
        const fields = {
          [checkboxField]: false,
          [volumeField]: null,
          ...{ pipette },
        }
        expect(minAirGapVolume({ ...fields })).toBe(null)
      })
      it('should NOT return a warning when there is no air gap volume specified', () => {
        const fields = {
          [checkboxField]: true,
          [volumeField]: null,
          ...{ pipette },
        }
        expect(minAirGapVolume({ ...fields })).toBe(null)
      })
      it('should NOT return a warning when the air gap volume is greater than the pipette min volume', () => {
        const fields = {
          [checkboxField]: true,
          [volumeField]: '150',
          ...{ pipette },
        }
        expect(minAirGapVolume(fields)).toBe(null)
      })

      it('should NOT return a warning when the air gap volume is equal to the the pipette min volume', () => {
        const fields = {
          [checkboxField]: true,
          [volumeField]: '100',
          ...{ pipette },
        }
        expect(minAirGapVolume(fields)).toBe(null)
      })
      it('should return a warning when the air gap volume is less than the pipette min volume', () => {
        const fields = {
          [checkboxField]: true,
          [volumeField]: '0',
          ...{ pipette },
        }
        // @ts-expect-error(sa, 2021-6-15): minAirGapVolume might return null, need to null check before property access
        expect(minAirGapVolume(fields).type).toBe('BELOW_MIN_AIR_GAP_VOLUME')
      })
      it('should return a warning when the transfer volume is less than the pipette min volume', () => {
        const fields = {
          [checkboxField]: true,
          [volumeField]: '0',
          ...{ pipette },
        }
        // @ts-expect-error(sa, 2021-6-15): minAirGapVolume might return null, need to null check before property access
        expect(minAirGapVolume(fields).type).toBe('BELOW_MIN_AIR_GAP_VOLUME')
      })
    })
  })
})
describe('Below pipette minimum volume', () => {
  let fieldsWithPipette: { pipette: { spec: { minVolume: number } } }
  beforeEach(() => {
    fieldsWithPipette = {
      pipette: {
        spec: {
          minVolume: 100,
        },
      },
    }
  })
  it('should NOT return a warning when the volume equals the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 100,
    }
    expect(belowPipetteMinimumVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is greater than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 101,
    }
    expect(belowPipetteMinimumVolume(fields)).toBe(null)
  })
  it('should return a warning when the volume is less than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 99,
    }
    // @ts-expect-error(sa, 2021-6-15): belowPipetteMinimumVolume might return null, need to null check before property access
    expect(belowPipetteMinimumVolume(fields).type).toBe(
      'BELOW_PIPETTE_MINIMUM_VOLUME'
    )
  })
})
describe('Below min disposal volume', () => {
  let fieldsWithPipette: {
    pipette: { spec: { minVolume: number } }
    disposalVolume_checkbox: boolean
    disposalVolume_volume: number
    path: string
  }
  beforeEach(() => {
    fieldsWithPipette = {
      pipette: {
        spec: {
          minVolume: 100,
        },
      },
      disposalVolume_checkbox: true,
      disposalVolume_volume: 100,
      path: 'multiDispense',
    }
  })
  it('should NOT return a warning when there is no pipette', () => {
    const fields = {
      ...fieldsWithPipette,
      pipette: undefined,
    }
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when there is no pipette spec', () => {
    const fields = {
      ...fieldsWithPipette,
      pipette: { spec: undefined },
    }
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the path is NOT multi dispense', () => {
    const fields = {
      ...fieldsWithPipette,
      path: 'another_path',
    }
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is equal to the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 100,
    }
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is greater than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 100,
    }
    expect(minDisposalVolume(fields)).toBe(null)
  })

  it('should return a warning when the volume is less than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 99,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
  it('should return a warning when the path is multi dispense and the checkbox is unchecked', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_checkbox: false,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
  it('should return a warning when the path is multi dispense and there is no disposal volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: undefined,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
})
describe('Max dispense well volume', () => {
  let fieldsWithDispenseLabware: any
  beforeEach(() => {
    fieldsWithDispenseLabware = {
      dispense_labware: { def: { ...fixture_24_tuberack } },
      dispense_wells: ['A1', 'A2'],
    }
  })
  it('should NOT return a warning when there is no dispense labware', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      dispense_labware: undefined,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when there are no dispense wells', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      dispense_wells: undefined,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is less than the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is 2000 (see fixture)
      volume: 1999,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume equals the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is also 2000 (see fixture)
      volume: 2000,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should return a warning when the volume is greater than the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is 2000 (see fixture)
      volume: 2001,
    }
    // @ts-expect-error(sa, 2021-6-15): maxDispenseWellVolume might return null, need to null check before property access
    expect(maxDispenseWellVolume(fields).type).toBe('OVER_MAX_WELL_VOLUME')
  })
})
