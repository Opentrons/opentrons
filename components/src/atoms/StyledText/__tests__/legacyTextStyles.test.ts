import { describe, expect, it } from 'vitest'

import { TYPOGRAPHY } from '../../../ui-style-constants'

import {
  isLegacyTextStyle,
  resolveLegacyTextStyle,
} from '../legacyTextStyles'

describe('legacyTextStyles', () => {
  it('resolves from textStyle when provided', () => {
    expect(resolveLegacyTextStyle({ textStyle: 'legacy-h3-bold' }).as).toBe(
      'h3'
    )
  })

  it('resolves from as + fontWeight when textStyle is omitted', () => {
    expect(
      resolveLegacyTextStyle({
        as: 'h3',
        fontWeight: TYPOGRAPHY.fontWeightBold,
      }).as
    ).toBe('h3')
    expect(
      resolveLegacyTextStyle({
        forwardedAs: 'h2',
        fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      }).className
    ).toBe(
      resolveLegacyTextStyle({ textStyle: 'legacy-h2-semi-bold' }).className
    )
    expect(resolveLegacyTextStyle({ as: 'label' }).as).toBe('label')
    expect(resolveLegacyTextStyle({}).as).toBe('p')
  })

  it('identifies legacy text style names', () => {
    expect(isLegacyTextStyle('legacy-h3-bold')).toBe(true)
    expect(isLegacyTextStyle('legacy-caption-regular')).toBe(true)
    expect(isLegacyTextStyle('helix-caption-regular')).toBe(false)
  })
})
