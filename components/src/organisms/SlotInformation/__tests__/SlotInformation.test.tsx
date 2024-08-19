import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../testing/utils'
import { ListItem } from '../../../atoms/ListItem'

import { SlotInformation } from '..'

vi.mock('../../../atoms/ListItem')
vi.mock('../../../molecules/DeckInfoLabel', importOriginal => {
  return {
    DeckInfoLabel: () => <div>mock DeckInfoLabel</div>,
  }
})

const render = (props: React.ComponentProps<typeof SlotInformation>) => {
  return renderWithProviders(<SlotInformation {...props} />)
}

describe('SlotInformation', () => {
  let props: React.ComponentProps<typeof SlotInformation>

  beforeEach(() => {
    props = {
      location: 'A1',
      liquids: [],
      labwares: [],
      modules: [],
    }
    vi.mocked(ListItem).mockReturnValue(<div>mock ListItem</div>)
  })

  it('should render DeckInfoLabel and title', () => {
    render(props)
    screen.getByText('mock DeckInfoLabel')
    screen.getByText('Slot Stack Information')
  })

  it('should render ListItem and ListItemDescriptor', () => {
    render(props)
    expect(screen.getAllByText('mock ListItem').length).toBe(3)
  })
})
