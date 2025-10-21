import { describe, expect, it } from 'vitest'

import { getShouldShowPipetteType } from '../utils'

const mockLeftPipette = {
  mount: 'left',
  id: 'mockLeft',
  name: 'p50_single_flex',
  pythonName: 'mockPythonName',
} as any
const mockRightPiette = {
  mount: 'right',
  id: 'mockRight',
  name: 'p50_multi_flex',
  pythonName: 'mockPythonName',
} as any

describe('getShouldShowPipetteType', () => {
  it('should always show 1-Channel and 8-Channel pipettes', () => {
    const scenarios = [
      {
        leftPipette: null,
        rightPipette: null,
        currentEditingMount: null,
      },
      {
        leftPipette: mockLeftPipette,
        rightPipette: mockRightPiette,
        currentEditingMount: 'left' as any,
      },
    ]

    scenarios.forEach(scenario => {
      expect(
        getShouldShowPipetteType(
          'single',
          scenario.leftPipette,
          scenario.rightPipette,
          scenario.currentEditingMount
        )
      ).toBe(true)
      expect(
        getShouldShowPipetteType(
          'multi',
          scenario.leftPipette,
          scenario.rightPipette,
          scenario.currentEditingMount
        )
      ).toBe(true)
    })
  })

  it('should show 96-Channel when other 96 is attached now that we have two 96 channel options', () => {
    expect(getShouldShowPipetteType('96', mockLeftPipette, null, 'left')).toBe(
      true
    )
  })

  it('should show 96-Channel when adding a new pipette and both mounts are empty', () => {
    expect(getShouldShowPipetteType('96', null, null, null)).toBe(true)
  })

  it('should not show 96-Channel when adding a new pipette and one mount is occupied', () => {
    expect(getShouldShowPipetteType('96', mockLeftPipette, null, null)).toBe(
      false
    )
    expect(getShouldShowPipetteType('96', null, mockRightPiette, null)).toBe(
      false
    )
  })

  it('should show 96-Channel when editing left mount and right is empty', () => {
    expect(getShouldShowPipetteType('96', mockLeftPipette, null, 'left')).toBe(
      true
    )
  })

  it('should show 96-Channel when editing right mount and left is empty', () => {
    expect(getShouldShowPipetteType('96', null, mockRightPiette, 'right')).toBe(
      true
    )
  })

  it('should not show 96-Channel when editing a mount and the other is occupied', () => {
    expect(
      getShouldShowPipetteType('96', mockLeftPipette, mockRightPiette, 'left')
    ).toBe(false)
    expect(
      getShouldShowPipetteType('96', mockLeftPipette, mockRightPiette, 'right')
    ).toBe(false)
  })
})
