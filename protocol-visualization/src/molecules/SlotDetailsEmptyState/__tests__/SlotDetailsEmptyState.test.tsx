import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { SlotDetailsEmptyState } from '..'
import { renderWithProviders } from '../../../__testing-utils__'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SlotDetailsEmptyState>) => {
  return renderWithProviders(<SlotDetailsEmptyState {...props} />) // TODO: add i18n rendering option
}

describe('SlotDetailsEmptyState', () => {
  let props: ComponentProps<typeof SlotDetailsEmptyState>

  beforeEach(() => {
    props = {
      slotId: 'A1',
    }
  })

  it('should render slot empty state', () => {
    render(props)
    screen.getByText('A1')
    screen.getByText('slot_empty')
  })
})
