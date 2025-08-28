import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConcurrentGroupStepContainer } from '../ConcurrentGroupStepContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ConcurrentGroupStepContainer>) => {
  return renderWithProviders(<ConcurrentGroupStepContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConcurrentGroupStepContainer', () => {
  it('renders a StepContainer inside a list item', () => {
    render({
      text: 'Test step text',
      iconName: 'transfer',
      type: 'default',
      size: 'iconAndText',
      active: false,
      error: false,
      hover: false,
      semiTransparent: false,
      cursor: 'default',
    })

    const listItem = screen.getByRole('listitem')
    expect(within(listItem).getByText('Test step text')).toBeInTheDocument()
  })
})
