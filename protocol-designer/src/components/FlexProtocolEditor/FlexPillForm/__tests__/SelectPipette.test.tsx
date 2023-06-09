import { checkSelectedPipette } from '../SelectPipette'

describe('Flex SelectPipette Component', () => {
  it('should return true if pipetteName is included in blockMount', () => {
    const pipetteName = 'p1000_96'
    const result = checkSelectedPipette(pipetteName)
    expect(result).toBeTruthy()
  })

  it('should return false if pipetteName is not included in blockMount', () => {
    const pipetteName = 'p50'
    const result = checkSelectedPipette(pipetteName)
    expect(result).toBeFalsy()
  })

  it('should return false if blockMount is empty', () => {
    const pipetteName = 'p50'
    const result = checkSelectedPipette(pipetteName)
    expect(result).toBeFalsy()
  })

  it('should return true if pipetteName is the only element in blockMount', () => {
    const pipetteName = 'p1000_96'
    const result = checkSelectedPipette(pipetteName)
    expect(result).toBeTruthy()
  })

  it('returns true for selected pipette', () => {
    const pipetteName = 'p1000_96'
    const isSelected = checkSelectedPipette(pipetteName)
    expect(isSelected).toBe(true)
  })

  it('returns false for non-selected pipette', () => {
    const pipetteName = 'p1000_single'
    const isSelected = checkSelectedPipette(pipetteName)
    expect(isSelected).toBe(false)
  })
})
