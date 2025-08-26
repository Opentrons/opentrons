import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { CheckpointStepContainer } from '../CheckpointStepContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof CheckpointStepContainer>) => {
  return renderWithProviders(<CheckpointStepContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CheckpointStepContainer', () => {
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
