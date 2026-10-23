import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { SlotDetailsEmptyState } from '..'
import { renderWithProviders } from '../../../__testing-utils__'

const render = () => {
  return renderWithProviders(<SlotDetailsEmptyState />) // TODO: add i18n rendering option
}

describe('SlotDetailsEmptyState', () => {
  it('should render slot empty state', () => {
    render()
    screen.getByText('slot_empty')
  })
})
