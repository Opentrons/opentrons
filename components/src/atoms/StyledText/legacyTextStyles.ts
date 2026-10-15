import { TYPOGRAPHY } from '../../ui-style-constants'
import styles from './legacystyledtext.module.css'

type LegacyFontWeightKey = 'regular' | 'semi-bold' | 'bold'

interface LegacyTextStyleDefinition {
  as: keyof JSX.IntrinsicElements
  weight: LegacyFontWeightKey
  className: string
}


const legacyTextStyleMap = {
  'legacy-h1': {
    as: 'h1',
    weight: 'regular',
    className: styles.legacy_h1,
  },
  'legacy-h2': {
    as: 'h2',
    weight: 'regular',
    className: styles.legacy_h2,
  },
  'legacy-h2-semi-bold': {
    as: 'h2',
    weight: 'semi-bold',
    className: styles.legacy_h2_semi_bold,
  },
  'legacy-h2-bold': {
    as: 'h2',
    weight: 'bold',
    className: styles.legacy_h2_bold,
  },
  'legacy-h3': {
    as: 'h3',
    weight: 'regular',
    className: styles.legacy_h3,
  },
  'legacy-h3-semi-bold': {
    as: 'h3',
    weight: 'semi-bold',
    className: styles.legacy_h3_semi_bold,
  },
  'legacy-h3-bold': {
    as: 'h3',
    weight: 'bold',
    className: styles.legacy_h3_bold,
  },
  'legacy-h4': {
    as: 'h4',
    weight: 'regular',
    className: styles.legacy_h4,
  },
  'legacy-h4-semi-bold': {
    as: 'h4',
    weight: 'semi-bold',
    className: styles.legacy_h4_semi_bold,
  },
  'legacy-h4-bold': {
    as: 'h4',
    weight: 'bold',
    className: styles.legacy_h4_bold,
  },
  'legacy-h6': {
    as: 'h6',
    weight: 'regular',
    className: styles.legacy_h6,
  },
  'legacy-h6-semi-bold': {
    as: 'h6',
    weight: 'semi-bold',
    className: styles.legacy_h6_semi_bold,
  },
  'legacy-p': {
    as: 'p',
    weight: 'regular',
    className: styles.legacy_p,
  },
  'legacy-p-semi-bold': {
    as: 'p',
    weight: 'semi-bold',
    className: styles.legacy_p_semi_bold,
  },
  'legacy-p-bold': {
    as: 'p',
    weight: 'bold',
    className: styles.legacy_p_bold,
  },
  'legacy-label': {
    as: 'label',
    weight: 'regular',
    className: styles.legacy_label,
  },
  'legacy-label-semi-bold': {
    as: 'label',
    weight: 'semi-bold',
    className: styles.legacy_label_semi_bold,
  },
  'legacy-label-bold': {
    as: 'label',
    weight: 'bold',
    className: styles.legacy_label_bold,
  },
} as const satisfies Record<string, LegacyTextStyleDefinition>

type LegacyTextStyle = keyof typeof legacyTextStyleMap

const legacyTextStyleByTagAndWeight: Partial<
  Record<string, Partial<Record<LegacyFontWeightKey, LegacyTextStyle>>>
> = {}

for (const [styleKey, definition] of Object.entries(
  legacyTextStyleMap
) as Array<[LegacyTextStyle, LegacyTextStyleDefinition]>) {
  const byWeight = legacyTextStyleByTagAndWeight[definition.as] ?? {}
  byWeight[definition.weight] = styleKey
  legacyTextStyleByTagAndWeight[definition.as] = byWeight
}

function fontWeightToKey(fontWeight?: string | number): LegacyFontWeightKey {
  if (fontWeight === TYPOGRAPHY.fontWeightSemiBold) {
    return 'semi-bold'
  }
  if (fontWeight === TYPOGRAPHY.fontWeightBold) {
    return 'bold'
  }
  return 'regular'
}

/** Resolve the CSS module class for as/forwardedAs + fontWeight. */
export function resolveLegacyTextStyle({
  as,
  forwardedAs,
  fontWeight,
}: {
  as?: string
  forwardedAs?: string
  fontWeight?: string | number
}): string {
  const tag = forwardedAs ?? as ?? 'p'
  const weight = fontWeightToKey(fontWeight)
  const resolved =
    legacyTextStyleByTagAndWeight[tag]?.[weight] ?? ('legacy-p' as const)
  return legacyTextStyleMap[resolved].className
}
