import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConcurrentGroupCheckpoint } from '../ConcurrentGroupCheckpoint'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ConcurrentGroupCheckpoint>) => {
  return renderWithProviders(<ConcurrentGroupCheckpoint {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConcurrentGroupCheckpoint', () => {
  it('renders a checkpoint inside a list item', () => {
    render({
      text: 'Test checkpoint text',
    })

    const listItem = screen.getByRole('listitem')
    expect(
      within(listItem).getByText('Test checkpoint text')
    ).toBeInTheDocument()
  })
})
