import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../../helix-design-system/product'
import { renderWithProviders } from '../../../testing/utils'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import legacyStyles from '../legacystyledtext.module.css'
import { StyledText } from '../StyledText'
import styles from '../styledtext.module.css'
import { OLD_API_TRANSLATIONS } from './legacyTextStyleFixtures'
import {
  DESKTOP_STYLE_TRANSLATIONS,
  ODD_STYLE_TRANSLATIONS,
} from './styledTextStyleFixtures'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof StyledText>) => {
  return renderWithProviders(<StyledText {...props} />)[0]
}

describe('StyledText', () => {
  it.each(DESKTOP_STYLE_TRANSLATIONS.filter(t => t.font != null))(
    'renders desktopStyle=$desktopStyle with Helix font',
    ({ desktopStyle, font }) => {
      const { unmount } = render({
        desktopStyle,
        children: desktopStyle,
      })

      const el = screen.getByText(desktopStyle)
      expect(el).toHaveClass(styles.desktop_helix_font)
      expect(el).toHaveStyle(`--helix-font: ${font}`)
      unmount()
    }
  )

  it.each(ODD_STYLE_TRANSLATIONS.filter(t => t.tokens != null))(
    'renders oddStyle=$oddStyle with ODD typography tokens',
    ({ oddStyle, tokens }) => {
      const { unmount } = render({
        oddStyle,
        children: oddStyle,
      })

      const el = screen.getByText(oddStyle)
      expect(el).toHaveClass(styles.odd_style)
      expect(el).toHaveStyle(`--odd-font-size: ${tokens!.fontSize}`)
      expect(el).toHaveStyle(`--odd-line-height: ${tokens!.lineHeight}`)
      if (tokens!.fontWeight != null) {
        expect(el).toHaveStyle(`--odd-font-weight: ${tokens!.fontWeight}`)
      }
      unmount()
    }
  )

  it('renders Helix desktop and ODD tokens together', () => {
    render({
      desktopStyle: 'bodyDefaultRegular',
      oddStyle: 'bodyTextRegular',
      children: 'both',
    })

    const el = screen.getByText('both')
    expect(el).toHaveClass(styles.desktop_helix_font)
    expect(el).toHaveClass(styles.odd_style)
    expect(el).toHaveStyle(
      `--helix-font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular}`
    )
    expect(el).toHaveStyle(`--odd-font-size: ${TYPOGRAPHY.fontSize22}`)
    expect(el).toHaveStyle(`--odd-font-weight: ${TYPOGRAPHY.fontWeightRegular}`)
    expect(el).toHaveStyle(`--odd-line-height: ${TYPOGRAPHY.lineHeight28}`)
  })

  it('derives the semantic DOM tag from desktopStyle', () => {
    render({
      desktopStyle: 'headingLargeBold',
      children: 'heading',
    })

    expect(screen.getByText('heading').tagName).toBe('H2')
  })

  it('lets as override the style-derived tag', () => {
    render({
      as: 'h1',
      desktopStyle: 'headingLargeBold',
      children: 'heading',
    })

    expect(screen.getByText('heading').tagName).toBe('H1')
  })

  it.each(OLD_API_TRANSLATIONS)(
    'supports Legacy API as=$as + fontWeight → $label',
    ({ as, fontWeight, className }) => {
      const { unmount } = render({
        as,
        fontWeight,
        children: 'legacy',
      })

      const el = screen.getByText('legacy')
      expect(el).toHaveClass(className)
      expect(el.tagName).toBe(as.toUpperCase())
      unmount()
    }
  )

  it('uses forwardedAs for the legacy tag when provided', () => {
    render({
      as: 'p',
      forwardedAs: 'h2',
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      children: 'forwarded',
    })

    const el = screen.getByText('forwarded')
    expect(el.tagName).toBe('H2')
    expect(el).toHaveClass(legacyStyles.legacy_h2_semi_bold)
  })

  it('prefers desktopStyle over legacy as/fontWeight styles', () => {
    render({
      as: 'h2',
      fontWeight: TYPOGRAPHY.fontWeightBold,
      desktopStyle: 'bodyDefaultRegular',
      children: 'modern',
    })

    const el = screen.getByText('modern')
    expect(el).toHaveClass(styles.desktop_helix_font)
    expect(el).not.toHaveClass(legacyStyles.legacy_h2_bold)
  })
})
