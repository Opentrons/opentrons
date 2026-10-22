import { describe, expect, it } from 'vitest'

import { OLD_API_TRANSLATIONS } from '../__fixtures__/legacyTextStyleFixtures'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../legacystyledtext.module.css'
import { resolveLegacyTextStyle } from '../legacyTextStyles'

describe('legacyTextStyles', () => {
  it.each(OLD_API_TRANSLATIONS)(
    'maps as=$as + fontWeight to $label',
    ({ as, fontWeight, className }) => {
      expect(resolveLegacyTextStyle({ as, fontWeight })).toBe(className)
    }
  )

  // this fallback is new, it was not in the old API it used to default to undefined with no matching style
  it('defaults to legacy-p when as/fontWeight do not match a style', () => {
    expect(resolveLegacyTextStyle({})).toBe(styles.legacy_p)
    expect(
      resolveLegacyTextStyle({
        as: 'h1',
        fontWeight: TYPOGRAPHY.fontWeightBold,
      })
    ).toBe(styles.legacy_p)
  })
})
