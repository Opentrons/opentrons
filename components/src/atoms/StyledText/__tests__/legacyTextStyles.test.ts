import { describe, expect, it } from 'vitest'

import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../legacystyledtext.module.css'
import { resolveLegacyTextStyle } from '../legacyTextStyles'
import { OLD_API_TRANSLATIONS } from './legacyTextStyleFixtures'

describe('legacyTextStyles', () => {
  it.each(OLD_API_TRANSLATIONS)(
    'maps as=$as + fontWeight to $label',
    ({ as, fontWeight, className }) => {
      expect(resolveLegacyTextStyle({ as, fontWeight })).toBe(className)
    }
  )

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
