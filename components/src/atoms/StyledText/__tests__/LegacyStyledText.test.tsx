import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
import { LegacyStyledText } from '../LegacyStyledText'
import {
  OLD_API_TRANSLATIONS,
  TEXT_STYLE_TRANSLATIONS,
} from './legacyTextStyleFixtures'

import type { ComponentProps, ReactElement } from 'react'

const render = (
  props: ComponentProps<typeof LegacyStyledText>,
  wrapper?: (node: ReactElement) => ReactElement
) => {
  const node = <LegacyStyledText {...props} />
  return renderWithProviders(wrapper != null ? wrapper(node) : node)[0]
}

const wrapInTable = (node: ReactElement): ReactElement => <table>{node}</table>

describe('LegacyStyledText', () => {
  it.each(TEXT_STYLE_TRANSLATIONS)(
    'renders textStyle $textStyle on $as with the expected class',
    ({ textStyle, as, className }) => {
      const { unmount } = render({
        textStyle,
        children: textStyle,
      })

      const el = screen.getByText(textStyle)
      expect(el.tagName).toBe(as.toUpperCase())
      expect(el).toHaveClass(className)
      unmount()
    }
  )

  it.each(OLD_API_TRANSLATIONS)(
    'renders old API as=$as + fontWeight with the same class as $textStyle',
    ({ as, fontWeight, className, textStyle }) => {
      const { unmount } = render(
        {
          as,
          fontWeight,
          children: textStyle,
        },
        as === 'caption' ? wrapInTable : undefined
      )

      expect(screen.getByText(textStyle)).toHaveClass(className)
      unmount()
    }
  )

  it.each(OLD_API_TRANSLATIONS)(
    'renders old API forwardedAs=$as + fontWeight with the same class as $textStyle',
    ({ as, fontWeight, className, textStyle }) => {
      const { unmount } = render(
        {
          forwardedAs: as,
          fontWeight,
          children: textStyle,
        },
        as === 'caption' ? wrapInTable : undefined
      )

      expect(screen.getByText(textStyle)).toHaveClass(className)
      unmount()
    }
  )
})
