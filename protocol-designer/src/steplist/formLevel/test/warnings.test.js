// @flow
import { minAirGapVolume } from '../warnings'

describe('warnings', () => {
  let pipette
  beforeEach(() => {
    pipette = {
      spec: {
        minVolume: 100,
      },
    }
  })
  describe('min air gap volume', () => {
    it('should NOT return a warning when the air gap checkbox is not selected', () => {
      const fields = {
        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        ...{ pipette },
      }
      expect(minAirGapVolume({ ...fields })).toBe(null)
    })
    it('should NOT return a warning when there is no air gap volume specified', () => {
      const fields = {
        aspirate_airGap_checkbox: true,
        aspirate_airGap_volume: null,
        ...{ pipette },
      }
      expect(minAirGapVolume({ ...fields })).toBe(null)
    })
    it('should NOT return a warning when the air gap volume is greater than the pipette min volume', () => {
      const fields = {
        aspirate_airGap_checkbox: true,
        aspirate_airGap_volume: '150',
        ...{ pipette },
      }
      expect(minAirGapVolume(fields)).toBe(null)
    })

    it('should NOT return a warning when the air gap volume is equal to the the pipette min volume', () => {
      const fields = {
        aspirate_airGap_checkbox: true,
        aspirate_airGap_volume: '100',
        ...{ pipette },
      }
      expect(minAirGapVolume(fields)).toBe(null)
    })
    it('should return a warning when the air gap volume is less than the pipette min volume', () => {
      const fields = {
        aspirate_airGap_checkbox: true,
        aspirate_airGap_volume: '0',
        ...{ pipette },
      }
      expect(minAirGapVolume(fields).type).toBe('BELOW_MIN_AIR_GAP_VOLUME')
    })
  })
})
