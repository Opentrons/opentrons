import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../testing/utils'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { Box } from '../../../primitives'
import { DeckLabel } from '../../../molecules/DeckLabel'
import { DeckLabelSet } from '..'

vi.mock('../../../molecules/DeckLabel')

const mockDeckLabels = [
  {
    text: 'Label',
    isSelected: false,
    labelBorderRadius: BORDERS.borderRadius4,
  },
  {
    text: 'Label',
    isSelected: false,
    labelBorderRadius: BORDERS.borderRadius4,
  },
]

const render = (props: React.ComponentProps<typeof DeckLabelSet>) => {
  return renderWithProviders(<DeckLabelSet {...props} />)
}
describe('DeckLabelSet', () => {
  let props: React.ComponentProps<typeof DeckLabelSet>

  beforeEach(() => {
    props = {
      children: (
        <Box width="31.9375rem" height="5.75rem">
          test
        </Box>
      ),
      deckLabels: mockDeckLabels,
    }
    vi.mocked(DeckLabel).mockReturnValue(<div>mock DeckLabels</div>)
  })

  it('should render blue border and DeckLabel', () => {
    render(props)
    expect(screen.getAllByText('mock DeckLabels').length).toBe(2)
    screen.getByText('test')
    const deckLabelSet = screen.getByTestId('DeckLabeSet')
    expect(deckLabelSet).toHaveStyle(`border: 3px solid ${COLORS.blue50}`)
    expect(deckLabelSet).toHaveStyle(`border-radius: ${BORDERS.borderRadius8}`)
  })
})
