import { describe, expect, it, vi } from 'vitest'

import { getWizardHeaderExit } from '../getWizardHeaderExit'

describe('getWizardHeaderExit', () => {
  const onExitError = vi.fn()
  const onExitIdle = vi.fn()

  it('keeps Exit enabled and uses the error closer on error screens', () => {
    expect(
      getWizardHeaderExit({
        isError: true,
        isBusy: true,
        onExitError,
        onExitIdle,
      })
    ).toEqual({ onExit: onExitError, exitDisabled: false })
  })

  it('hides Exit while the wizard is busy and not in an error', () => {
    expect(
      getWizardHeaderExit({
        isError: false,
        isBusy: true,
        onExitError,
        onExitIdle,
      })
    ).toEqual({ onExit: undefined, exitDisabled: true })
  })

  it('uses the idle closer when the wizard is not busy', () => {
    expect(
      getWizardHeaderExit({
        isError: false,
        isBusy: false,
        onExitError,
        onExitIdle,
      })
    ).toEqual({ onExit: onExitIdle, exitDisabled: false })
  })
})
