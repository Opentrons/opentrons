import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../legacystyledtext.module.css'

import type { LegacyFontWeight, LegacyTextTag } from '../legacyTextStyles'

/**
 * Old LegacyStyledText API cases copied from LegacyStyledText.
 */
export const OLD_API_TRANSLATIONS: Array<{
  as: LegacyTextTag
  fontWeight?: LegacyFontWeight
  className: string
  label: string
}> = [
  {
    label: 'h1',
    as: 'h1',
    className: styles.legacy_h1,
  },
  {
    label: 'h2',
    as: 'h2',
    className: styles.legacy_h2,
  },
  {
    label: 'h2SemiBold',
    as: 'h2',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h2_semi_bold,
  },
  {
    label: 'h2Bold',
    as: 'h2',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h2_bold,
  },
  {
    label: 'h3',
    as: 'h3',
    className: styles.legacy_h3,
  },
  {
    label: 'h3SemiBold',
    as: 'h3',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h3_semi_bold,
  },
  {
    label: 'h3Bold',
    as: 'h3',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h3_bold,
  },
  {
    label: 'h4',
    as: 'h4',
    className: styles.legacy_h4,
  },
  {
    label: 'h4SemiBold',
    as: 'h4',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h4_semi_bold,
  },
  {
    label: 'h4Bold',
    as: 'h4',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h4_bold,
  },
  {
    label: 'h6',
    as: 'h6',
    className: styles.legacy_h6,
  },
  {
    label: 'h6SemiBold',
    as: 'h6',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h6_semi_bold,
  },
  {
    label: 'p',
    as: 'p',
    className: styles.legacy_p,
  },
  {
    label: 'pSemiBold',
    as: 'p',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_p_semi_bold,
  },
  {
    label: 'pBold',
    as: 'p',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_p_bold,
  },
  {
    label: 'label',
    as: 'label',
    className: styles.legacy_label,
  },
  {
    label: 'labelSemiBold',
    as: 'label',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_label_semi_bold,
  },
  {
    label: 'labelBold',
    as: 'label',
    fontWeight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_label_bold,
  },
]
