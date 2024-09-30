import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  getIs96ChannelPipetteAttached,
  getOffsetCalibrationForMount,
} from '../utils'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '/app/redux/calibration/pipette-offset/__fixtures__'
import type {
  FetchPipettesResponseBody,
  FetchPipettesResponsePipette,
} from '/app/redux/pipettes/types'

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
      name: 'p10_single_v1',
    } as FetchPipettesResponsePipette

    const result = getIs96ChannelPipetteAttached(mockLeftMountAttachedPipette)
    expect(result).toEqual(false)
  })
})

describe('getOffsetCalibrationForMount', () => {
  const mockLeftMountAttachedPipette = {
    name: 'mock left pipette',
  } as FetchPipettesResponsePipette
  const mockRightMountAttachedPipette = {
    name: 'mock right pipette',
  } as FetchPipettesResponsePipette
  it('returns null when not given calibrations', () => {
    const result = getOffsetCalibrationForMount(
      null,
      {
        left: mockLeftMountAttachedPipette,
        right: mockRightMountAttachedPipette,
      },
      'right'
    )
    expect(result).toEqual(null)
  })

  it("returns null when asked for calibrations that don't exist for a mount", () => {
    const calibrations = [mockPipetteOffsetCalibration1]
    const result = getOffsetCalibrationForMount(
      calibrations,
      {
        left: mockLeftMountAttachedPipette,
        right: mockRightMountAttachedPipette,
      },
      'right'
    )
    expect(result).toEqual(null)
  })

  it('returns the correct calibrations for a mount', () => {
    const { pipette } = mockPipetteOffsetCalibration2
    const mockAttachedPipettes: FetchPipettesResponseBody = {
      left: mockLeftMountAttachedPipette, // this one doesn't matter too much since we're looking for the right mount cal
      right: {
        id: pipette,
        name: `test-${pipette}`,
        model: 'p10_single_v1',
        tip_length: 0,
        mount_axis: 'z',
        plunger_axis: 'a',
      },
    }
    const calibrations = [
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ]
    const result = getOffsetCalibrationForMount(
      calibrations,
      mockAttachedPipettes,
      'right'
    )
    expect(result).toEqual(mockPipetteOffsetCalibration2)
  })
})
