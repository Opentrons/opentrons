import { times } from 'lodash'
import { describe, expect, it } from 'vitest'

import { generatePassword } from '../generatePassword'

describe('generatePassword()', () => {
  it('should return unique passwords', () => {
    const trials = times(100, generatePassword)
    const uniqueTrials = new Set(trials)
    expect(trials).toHaveLength(uniqueTrials.size)
  })

  it('should return passwords in the expected format', () => {
    const password = generatePassword()
    expect(password).toMatch(/^[a-z]{3}-[a-z]{3}-[a-z]{3}-[a-z]{3}$/)
  })
})
