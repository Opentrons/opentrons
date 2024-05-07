import { describe, it, expect } from 'vitest'
import { detectSimulate } from '../utils'

describe('detectSimulate', () => {
  it('should return true', () => {
    expect(detectSimulate('simulate')).toBeTruthy()
    expect(detectSimulate('simulate the above protocol')).toBeTruthy()
    expect(detectSimulate('simulates the above protocol')).toBeTruthy()
    expect(detectSimulate('I want to simulate the above protocol')).toBeTruthy()
    expect(detectSimulate('Simulate')).toBeTruthy()
    expect(detectSimulate('Simulates')).toBeTruthy()
    expect(detectSimulate('SIMULATE')).toBeTruthy()
    expect(detectSimulate('SIMULATES')).toBeTruthy()
    expect(detectSimulate('please simulate the above protocol')).toBeTruthy()
  })

  it('should return false', () => {
    expect(detectSimulate('simulator')).toBeFalsy()
    expect(detectSimulate('run a simulator')).toBeFalsy()
    expect(detectSimulate('test')).toBeFalsy()
  })
})
