import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { DeckInfoLabel } from '../index'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DeckInfoLabel>) => {
  return renderWithProviders(<DeckInfoLabel {...props} />)
}

describe('DeckInfoLabel', () => {
  let props: ComponentProps<typeof DeckInfoLabel>

  beforeEach(() => {
    props = {
      deckLabel: 'A1',
    }
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => {
        return {
          matches: query === '(height: 610px) and (width: 1024px)',
          media: query,
        }
      }),
    })
  })

  it('should render the proper styles - web style', () => {
    render(props)
    const deckInfoLabel = screen.getByTestId('DeckInfoLabel_A1')
    expect(deckInfoLabel.className).toContain('label')
    expect(deckInfoLabel.className).toContain('deck_info_label_no_highlight')
    expect(deckInfoLabel.className).toContain('default')
  })

  it.todo('should render the proper styles - odd style')

  it('should render deck label', () => {
    render(props)
    screen.getByText('A1')
  })

  it('should render an icon', () => {
    props = {
      iconName: 'ot-temperature-v2',
    }
    render(props)
    screen.getByLabelText('ot-temperature-v2')
  })

  it('should render an icon large', () => {
    props = {
      iconName: 'ot-temperature-v2',
      size: 'large',
    }
    render(props)
    const deckInfoLabelIcon = screen.getByLabelText('ot-temperature-v2')
    expect(deckInfoLabelIcon).toHaveStyle('height: 1.5rem')
  })
})
