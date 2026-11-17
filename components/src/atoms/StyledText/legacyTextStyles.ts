import { TYPOGRAPHY } from '../../ui-style-constants'
import styles from './legacystyledtext.module.css'

export type LegacyTextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h6' | 'p' | 'label'

export type LegacyFontWeight =
  | typeof TYPOGRAPHY.fontWeightRegular
  | typeof TYPOGRAPHY.fontWeightSemiBold
  | typeof TYPOGRAPHY.fontWeightBold

interface LegacyTextStyleDefinition {
  as: LegacyTextTag
  weight: LegacyFontWeight
  className: string
}

const legacyTextStyleMap = {
  'legacy-h1': {
    as: 'h1',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_h1,
  },
  'legacy-h2': {
    as: 'h2',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_h2,
  },
  'legacy-h2-semi-bold': {
    as: 'h2',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h2_semi_bold,
  },
  'legacy-h2-bold': {
    as: 'h2',
    weight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h2_bold,
  },
  'legacy-h3': {
    as: 'h3',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_h3,
  },
  'legacy-h3-semi-bold': {
    as: 'h3',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h3_semi_bold,
  },
  'legacy-h3-bold': {
    as: 'h3',
    weight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h3_bold,
  },
  'legacy-h4': {
    as: 'h4',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_h4,
  },
  'legacy-h4-semi-bold': {
    as: 'h4',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h4_semi_bold,
  },
  'legacy-h4-bold': {
    as: 'h4',
    weight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_h4_bold,
  },
  'legacy-h6': {
    as: 'h6',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_h6,
  },
  'legacy-h6-semi-bold': {
    as: 'h6',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_h6_semi_bold,
  },
  'legacy-p': {
    as: 'p',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_p,
  },
  'legacy-p-semi-bold': {
    as: 'p',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_p_semi_bold,
  },
  'legacy-p-bold': {
    as: 'p',
    weight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_p_bold,
  },
  'legacy-label': {
    as: 'label',
    weight: TYPOGRAPHY.fontWeightRegular,
    className: styles.legacy_label,
  },
  'legacy-label-semi-bold': {
    as: 'label',
    weight: TYPOGRAPHY.fontWeightSemiBold,
    className: styles.legacy_label_semi_bold,
  },
  'legacy-label-bold': {
    as: 'label',
    weight: TYPOGRAPHY.fontWeightBold,
    className: styles.legacy_label_bold,
  },
} as const satisfies Record<string, LegacyTextStyleDefinition>

type LegacyTextStyle = keyof typeof legacyTextStyleMap

const legacyTextStyleByTagAndWeight: Partial<
  Record<LegacyTextTag, Partial<Record<LegacyFontWeight, LegacyTextStyle>>>
> = {}

for (const [styleKey, definition] of Object.entries(
  legacyTextStyleMap
) as Array<[LegacyTextStyle, LegacyTextStyleDefinition]>) {
  const byWeight = legacyTextStyleByTagAndWeight[definition.as] ?? {}
  byWeight[definition.weight] = styleKey
  legacyTextStyleByTagAndWeight[definition.as] = byWeight
}

/** Resolve the CSS module class for as/forwardedAs + fontWeight. */
export function resolveLegacyTextStyle({
  as,
  forwardedAs,
  fontWeight = TYPOGRAPHY.fontWeightRegular,
}: {
  as?: LegacyTextTag
  forwardedAs?: LegacyTextTag
  fontWeight?: LegacyFontWeight
}): string {
  const tag = forwardedAs ?? as ?? 'p'
  const resolved =
    legacyTextStyleByTagAndWeight[tag]?.[fontWeight] ?? ('legacy-p' as const)
  return legacyTextStyleMap[resolved].className
}
