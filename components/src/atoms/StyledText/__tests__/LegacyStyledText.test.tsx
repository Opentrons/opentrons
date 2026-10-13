import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
import { LegacyStyledText } from '../LegacyStyledText'
import { OLD_API_TRANSLATIONS } from './legacyTextStyleFixtures'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof LegacyStyledText>) => {
  return renderWithProviders(<LegacyStyledText {...props} />)[0]
}

describe('LegacyStyledText', () => {
  it.each(OLD_API_TRANSLATIONS)(
    'renders as=$as + fontWeight ($label) with the expected class',
    ({ as, fontWeight, className, label }) => {
      const { unmount } = render({
        as,
        fontWeight,
        children: label,
      })

      const el = screen.getByText(label)
      expect(el.tagName).toBe(as.toUpperCase())
      expect(el).toHaveClass(className)
      unmount()
    }
  )

  it.each(OLD_API_TRANSLATIONS)(
    'renders forwardedAs=$as + fontWeight ($label) with the expected class',
    ({ as, fontWeight, className, label }) => {
      const { unmount } = render({
        forwardedAs: as,
        fontWeight,
        children: label,
      })

      expect(screen.getByText(label)).toHaveClass(className)
      unmount()
    }
  )
})
