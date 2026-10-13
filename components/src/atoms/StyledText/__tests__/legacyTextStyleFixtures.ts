import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../legacystyledtext.module.css'
import { legacyTextStyleMap } from '../legacyTextStyles'

import type { LegacyTextStyle } from '../legacyTextStyles'

type LegacyTextStyleDefinition = (typeof legacyTextStyleMap)[LegacyTextStyle]

/** Derived from `legacyTextStyleMap` — textStyle → default tag + CSS class. */
export const TEXT_STYLE_TRANSLATIONS = (
  Object.entries(legacyTextStyleMap) as Array<
    [LegacyTextStyle, LegacyTextStyleDefinition]
  >
).map(([textStyle, { as, className }]) => ({ textStyle, as, className }))

/**
 * Old LegacyStyledText API cases, copied from the former styled-components
 * `styleMap` keys (`${as}${''|SemiBold|Bold}`).
 * Each case should resolve to the same CSS module class as the matching textStyle.
 */
export const OLD_API_TRANSLATIONS: Array<{
  textStyle: LegacyTextStyle
  as: keyof JSX.IntrinsicElements
  fontWeight?: string | number
  className: string
}> = [
  // h1
  {
    textStyle: 'legacy-h1',
    as: 'h1',
    className: styles.legacy_h1,
  },
  // h2 / h2SemiBold / h2Bold
  {
    textStyle: 'legacy-h2',
    as: 'h2',
    className: styles.legacy_h2,
  },
  {
    textStyle: 'legacy-h2-semi-bold',
    as: 'h2',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h2_semi_bold,
  },
  {
    textStyle: 'legacy-h2-bold',
    as: 'h2',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h2_bold,
  },
  // h3 / h3SemiBold / h3Bold
  {
    textStyle: 'legacy-h3',
    as: 'h3',
    className: styles.legacy_h3,
  },
  {
    textStyle: 'legacy-h3-semi-bold',
    as: 'h3',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h3_semi_bold,
  },
  {
    textStyle: 'legacy-h3-bold',
    as: 'h3',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h3_bold,
  },
  // h4 / h4SemiBold / h4Bold
  {
    textStyle: 'legacy-h4',
    as: 'h4',
    className: styles.legacy_h4,
  },
  {
    textStyle: 'legacy-h4-semi-bold',
    as: 'h4',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h4_semi_bold,
  },
  {
    textStyle: 'legacy-h4-bold',
    as: 'h4',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h4_bold,
  },
  // h6 / h6SemiBold
  {
    textStyle: 'legacy-h6',
    as: 'h6',
    className: styles.legacy_h6,
  },
  {
    textStyle: 'legacy-h6-semi-bold',
    as: 'h6',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h6_semi_bold,
  },
  // p / pSemiBold / pBold
  {
    textStyle: 'legacy-p',
    as: 'p',
    className: styles.legacy_p,
  },
  {
    textStyle: 'legacy-p-semi-bold',
    as: 'p',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_p_semi_bold,
  },
  {
    textStyle: 'legacy-p-bold',
    as: 'p',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_p_bold,
  },
  // label / labelSemiBold / labelBold
  {
    textStyle: 'legacy-label',
    as: 'label',
    className: styles.legacy_label,
  },
  {
    textStyle: 'legacy-label-semi-bold',
    as: 'label',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_label_semi_bold,
  },
  {
    textStyle: 'legacy-label-bold',
    as: 'label',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_label_bold,
  },
]
