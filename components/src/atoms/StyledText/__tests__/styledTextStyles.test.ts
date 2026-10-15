import { describe, expect, it } from 'vitest'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../../helix-design-system/product'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../styledtext.module.css'
import { resolveStyledTextStyles } from '../styledTextStyles'
import {
  DESKTOP_STYLE_TRANSLATIONS,
  ODD_STYLE_TRANSLATIONS,
} from './styledTextStyleFixtures'

describe('styledTextStyles', () => {
  it.each(DESKTOP_STYLE_TRANSLATIONS)(
    'maps desktopStyle=$desktopStyle to Helix typography',
    ({ desktopStyle, font }) => {
      const resolved = resolveStyledTextStyles({ desktopStyle })
      if (font == null) {
        expect(resolved.style).toBeUndefined()
        expect(resolved.className).toBe(styles.desktop_hidden)
      } else {
        expect(resolved.style).toEqual({ '--helix-font': font })
        expect(resolved.className).toContain(styles.desktop_helix_font)
      }
    }
  )

  it('applies Helix bodyDefaultRegular for bodyDefaultRegLink plus underline', () => {
    const resolved = resolveStyledTextStyles({
      desktopStyle: 'bodyDefaultRegLink',
    })
    expect(resolved.style).toEqual({
      '--helix-font': HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
    })
    expect(resolved.className).toContain(styles.desktop_underline)
  })

  it.each(ODD_STYLE_TRANSLATIONS)(
    'maps oddStyle=$oddStyle to ODD typography tokens',
    ({ oddStyle, tokens }) => {
      const resolved = resolveStyledTextStyles({ oddStyle })
      if (tokens == null) {
        expect(resolved.style).toBeUndefined()
        expect(resolved.className).toBe(styles.odd_hidden)
      } else {
        expect(resolved.style).toEqual({
          '--odd-font-size': tokens.fontSize,
          '--odd-line-height': tokens.lineHeight,
          ...(tokens.fontWeight != null
            ? { '--odd-font-weight': tokens.fontWeight }
            : {}),
        })
        expect(resolved.className).toContain(styles.odd_style)
      }
    }
  )

  it('combines Helix desktop font with ODD tokens', () => {
    const resolved = resolveStyledTextStyles({
      desktopStyle: 'displayBold',
      oddStyle: 'level1Header',
    })
    expect(resolved.style).toEqual({
      '--helix-font': HELIX_TYPOGRAPHY.fontStyleDisplayBold,
      '--odd-font-size': TYPOGRAPHY.fontSize80,
      '--odd-font-weight': TYPOGRAPHY.fontWeightBold,
      '--odd-line-height': TYPOGRAPHY.lineHeight96,
    })
    expect(resolved.className).toContain(styles.desktop_helix_font)
    expect(resolved.className).toContain(styles.odd_style)
  })

  it('returns empty styles when none are provided', () => {
    expect(resolveStyledTextStyles({})).toEqual({
      className: '',
      style: undefined,
    })
  })
})
