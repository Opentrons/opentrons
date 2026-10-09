import { TYPOGRAPHY } from '../../ui-style-constants'

import styles from './legacystyledtext.module.css'

type LegacyFontWeightKey = 'regular' | 'semi-bold' | 'bold'

interface LegacyTextStyleDefinition {
  as: keyof JSX.IntrinsicElements
  /** Tag used for as/forwardedAs lookup. Defaults to `as`. */
  tag?: string
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
  'legacy-caption-regular': {
    as: 'label',
    tag: 'caption',
    weight: 'regular',
    className: styles.legacy_caption_regular,
  },
} as const satisfies Record<string, LegacyTextStyleDefinition>

export type LegacyTextStyle = keyof typeof legacyTextStyleMap

const legacyTextStyleByTagAndWeight: Partial<
  Record<string, Partial<Record<LegacyFontWeightKey, LegacyTextStyle>>>
> = {}

for (const [textStyle, definition] of Object.entries(legacyTextStyleMap) as [
  LegacyTextStyle,
  LegacyTextStyleDefinition,
][]) {
  const tag = definition.tag ?? definition.as
  const byWeight = legacyTextStyleByTagAndWeight[tag] ?? {}
  byWeight[definition.weight] = textStyle
  legacyTextStyleByTagAndWeight[tag] = byWeight
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

/** Resolve a legacy text style from textStyle and/or as/forwardedAs + fontWeight. */
export function resolveLegacyTextStyle({
  textStyle,
  as,
  forwardedAs,
  fontWeight,
}: {
  textStyle?: LegacyTextStyle
  as?: string
  forwardedAs?: string
  fontWeight?: string | number
}): { as: keyof JSX.IntrinsicElements; className: string } {
  if (textStyle != null) {
    const { as: tagAs, className } = legacyTextStyleMap[textStyle]
    return { as: tagAs, className }
  }

  const tag = forwardedAs ?? as ?? 'p'
  const weight = fontWeightToKey(fontWeight)
  const resolved =
    legacyTextStyleByTagAndWeight[tag]?.[weight] ?? ('legacy-p' as const)
  const { as: tagAs, className } = legacyTextStyleMap[resolved]
  return { as: tagAs, className }
}

export function isLegacyTextStyle(styleName: string | undefined): boolean {
  return styleName != null && styleName in legacyTextStyleMap
}
