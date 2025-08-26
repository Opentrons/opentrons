import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { CheckpointChip } from '../CheckpointChip'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof CheckpointChip>) => {
  return renderWithProviders(<CheckpointChip {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CheckpointChip', () => {
  it('renders a chip inside a list item', () => {
    render({
      text: 'Test chip text',
    })

    const listItem = screen.getByRole('listitem')
    expect(within(listItem).getByText('Test chip text')).toBeInTheDocument()
  })
})
