import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'
import { CLEAN, EMPTY } from '@opentrons/step-generation'

/**
 * Ensures Yarn workspace `link:` dependencies resolve when running tests locally
 * (and in CI). The package entrypoint stays a stub until visualization UI lands.
 */
describe('workspace dependencies', () => {
  it('resolves @opentrons/components', () => {
    expect(COLORS.black90).toMatch(/^#/)
  })

  it('resolves @opentrons/step-generation', () => {
    expect(EMPTY).toBe('EMPTY')
    expect(CLEAN).toBe('CLEAN')
  })
})
