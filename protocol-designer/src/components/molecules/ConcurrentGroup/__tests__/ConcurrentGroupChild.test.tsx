import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConcurrentGroupChild } from '../ConcurrentGroupChild'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ConcurrentGroupChild>) => {
  return renderWithProviders(<ConcurrentGroupChild {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConcurrentGroupChild', () => {
  it('renders a child component inside a list item', () => {
    const child = <p>Test step text</p>
    render({ type: 'step', children: child })

    const listItem = screen.getByRole('listitem')
    expect(within(listItem).getByText('Test step text')).toBeInTheDocument()
  })
})
