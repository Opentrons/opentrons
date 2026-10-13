import { describe, expect, it } from 'vitest'

import { TYPOGRAPHY } from '../../../ui-style-constants'
import { isLegacyTextStyle, resolveLegacyTextStyle } from '../legacyTextStyles'
import {
  OLD_API_TRANSLATIONS,
  TEXT_STYLE_TRANSLATIONS,
} from './legacyTextStyleFixtures'

describe('legacyTextStyles', () => {
  it.each(TEXT_STYLE_TRANSLATIONS)(
    'maps $textStyle to $as with the expected CSS module class',
    ({ textStyle, as, className }) => {
      expect(resolveLegacyTextStyle({ textStyle })).toEqual({ as, className })
    }
  )

  it.each(OLD_API_TRANSLATIONS)(
    'maps old API as=$as + fontWeight to the same class as $textStyle',
    ({ textStyle, as, fontWeight }) => {
      expect(resolveLegacyTextStyle({ as, fontWeight })).toEqual(
        resolveLegacyTextStyle({ textStyle })
      )
    }
  )

  it('defaults to legacy-p when as/fontWeight do not match a style', () => {
    expect(resolveLegacyTextStyle({})).toEqual(
      resolveLegacyTextStyle({ textStyle: 'legacy-p' })
    )
    expect(
      resolveLegacyTextStyle({
        as: 'h1',
        fontWeight: TYPOGRAPHY.fontWeightBold,
      })
    ).toEqual(resolveLegacyTextStyle({ textStyle: 'legacy-p' }))
  })

  it('identifies legacy text style names', () => {
    expect(isLegacyTextStyle('legacy-h3-bold')).toBe(true)
    expect(isLegacyTextStyle('legacy-caption-regular')).toBe(true)
    expect(isLegacyTextStyle('helix-caption-regular')).toBe(false)
  })
})
