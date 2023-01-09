import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { getIsGantryEmpty } from '../utils'
import type { AttachedPipette } from '../../../redux/pipettes/types'

const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}

describe('getIsGantryEmpty', () => {
  it('should return true when no pipettes attached', () => {
    expect(getIsGantryEmpty({ left: null, right: null })).toEqual(true)
  })
  it('should return false when 1 pipette is attached', () => {
    expect(getIsGantryEmpty({ left: mockPipette, right: null })).toEqual(false)
  })
  it('should return false when 2 pipettes are attached', () => {
    expect(getIsGantryEmpty({ left: mockPipette, right: mockPipette })).toEqual(
      false
    )
  })
})
