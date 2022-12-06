import {
  formatTimestamp,
  getIs96ChannelPipetteAttached,
  getOffsetCalibrationForMount,
} from '../utils'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import type { FetchPipettesResponsePipette } from '../../../redux/pipettes/types'

describe('formatTimestamp', () => {
  it('should format an ISO 8601 date string', () => {
    const date = '2021-03-07T18:44:49.366581+00:00'

    expect(formatTimestamp(date)).toMatch(
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
    )
  })

  it('should pass through a non-ISO 8601 date string', () => {
    const date = '2/22/2022 1:00'

    expect(formatTimestamp(date)).toEqual(date)
  })

  it('should pass through a non-date string', () => {
    const noDate = 'A Protocol For Otie'

    expect(formatTimestamp(noDate)).toEqual(noDate)
  })
})

describe('getIs96ChannelPipetteAttached hook', () => {
  it('returns false when there is no pipette attached on the left mount', () => {
    const result = getIs96ChannelPipetteAttached(null)
    expect(result).toEqual(false)
  })

  it('returns true when there is a 96 channel pipette attached on the left mount', () => {
    const mockLeftMountAttachedPipette = {
      name: 'p1000_96',
    } as FetchPipettesResponsePipette

    const result = getIs96ChannelPipetteAttached(mockLeftMountAttachedPipette)
    expect(result).toEqual(true)
  })

  it('returns false when there is no 96 channel pipette attached on the left mount', () => {
    const mockLeftMountAttachedPipette = {
      name: 'mock single channel',
    } as FetchPipettesResponsePipette

    const result = getIs96ChannelPipetteAttached(mockLeftMountAttachedPipette)
    expect(result).toEqual(false)
  })
})

describe('getOffsetCalibrationForMount', () => {
  it('returns null when not given calibrations', () => {
    const result = getOffsetCalibrationForMount(null, 'right')
    expect(result).toEqual(null)
  })

  it("returns null when asked for calibrations that don't exist for a mount", () => {
    const calibrations = [mockPipetteOffsetCalibration1]
    const result = getOffsetCalibrationForMount(calibrations, 'right')
    expect(result).toEqual(null)
  })

  it('returns the correct calibrations for a mount', () => {
    const calibrations = [
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
    ]
    const result = getOffsetCalibrationForMount(calibrations, 'right')
    expect(result).toEqual(mockPipetteOffsetCalibration2)
  })
})
