import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeckLabel } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DeckLabel>) => {
  return renderWithProviders(<DeckLabel {...props} />)
}

describe('DeckLabel', () => {
  let props: ComponentProps<typeof DeckLabel>

  beforeEach(() => {
    props = {
      text: 'mock DeckLabel text',
      isSelected: false,
      isLast: true,
      isZoomed: true,
    }
  })

  it('should render text and styles isSelected - false', () => {
    render(props)
    screen.getByText('mock DeckLabel text')
    const deckLabel = screen.getByTestId('DeckLabel_UnSelected')
    expect(deckLabel.className).toContain('deck_label')
    expect(deckLabel.className).toContain('deck_label_unselected')
    expect(deckLabel.className).toContain('deck_label_zoomed')
  })

  it('should render text and styles isSelected - true', () => {
    props = {
      ...props,
      isSelected: true,
    }
    render(props)
    screen.getByText('mock DeckLabel text')
    const deckLabel = screen.getByTestId('DeckLabel_Selected')
    expect(deckLabel.className).toContain('deck_label')
    expect(deckLabel.className).toContain('deck_label_selected')
    expect(deckLabel.className).not.toContain('deck_label_unselected')
  })
})
