// @flow
import { _minAirGapVolume } from '../warnings'

const aspDisp = ['aspirate', 'dispense']
aspDisp.forEach(aspOrDisp => {
  const checkboxField = `${aspDisp}_airGap_checkbox`
  const volumeField = `${aspDisp}_airGap_volume`

  describe(`${aspOrDisp} -> air gap`, () => {
    let pipette
    beforeEach(() => {
      pipette = {
        spec: {
          minVolume: 100,
        },
      }
    })

    const minAirGapVolume = _minAirGapVolume(checkboxField, volumeField)

    describe('min air gap volume', () => {
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
        expect(minAirGapVolume(fields).type).toBe('BELOW_MIN_AIR_GAP_VOLUME')
      })
    })
  })
})
