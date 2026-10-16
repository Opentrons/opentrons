import { describe, expect, it } from 'vitest'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../../helix-design-system/product'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import styles from '../styledtext.module.css'
import {
  resolveStyledTextStyles,
  resolveStyledTextTag,
} from '../styledTextStyles'
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

  it.each([
    { desktopStyle: 'displayBold' as const, tag: 'h1' },
    { desktopStyle: 'headingLargeBold' as const, tag: 'h2' },
    { desktopStyle: 'headingMediumBold' as const, tag: 'h3' },
    { desktopStyle: 'headingSmallBold' as const, tag: 'h4' },
    { desktopStyle: 'bodyDefaultRegular' as const, tag: 'p' },
    { desktopStyle: 'captionRegular' as const, tag: 'label' },
  ])(
    'maps desktopStyle=$desktopStyle to semantic tag $tag',
    ({ desktopStyle, tag }) => {
      expect(resolveStyledTextTag({ desktopStyle })).toBe(tag)
    }
  )

  it.each([
    { oddStyle: 'level1Header' as const, tag: 'h1' },
    { oddStyle: 'level2HeaderBold' as const, tag: 'h2' },
    { oddStyle: 'level3HeaderBold' as const, tag: 'h3' },
    { oddStyle: 'level4HeaderBold' as const, tag: 'h4' },
    { oddStyle: 'bodyTextRegular' as const, tag: 'p' },
    { oddStyle: 'smallBodyTextBold' as const, tag: 'label' },
  ])('maps oddStyle=$oddStyle to semantic tag $tag', ({ oddStyle, tag }) => {
    expect(resolveStyledTextTag({ oddStyle })).toBe(tag)
  })

  it('prefers desktopStyle tag when both styles are set', () => {
    expect(
      resolveStyledTextTag({
        desktopStyle: 'headingSmallBold',
        oddStyle: 'level3HeaderBold',
      })
    ).toBe('h4')
  })
})
