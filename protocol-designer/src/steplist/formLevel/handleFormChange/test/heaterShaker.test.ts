import type { FormData } from '../../../../form-types'
import { dependentFieldsUpdateHeaterShaker } from '../dependentFieldsUpdateHeaterShaker'

describe('dependentFieldsUpdateHeaterShaker', () => {
  let formData: FormData
  beforeEach(() => {
    formData = {
      stepType: 'heaterShaker',
      id: '1',
      stepId: '2',
      latchOpen: true,
    }
  })
  it('should update latchOpen to false when setShake is toggled on', () => {
    expect(
      dependentFieldsUpdateHeaterShaker({ setShake: true }, formData)
    ).toEqual({ setShake: true, latchOpen: false })
  })
  it('should NOT update when setShake is toggled off', () => {
    expect(
      dependentFieldsUpdateHeaterShaker({ setShake: false }, formData)
    ).toEqual({ setShake: false })
  })
})
