import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { VacuumCheckCollar } from '../VacuumCheckCollar'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof VacuumCheckCollar>) => {
  return renderWithProviders(<VacuumCheckCollar {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumCheckCollar', () => {
  let props: ComponentProps<typeof VacuumCheckCollar>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders the VacuumCheckCollar component with the correct props', () => {
    render(props)

    expect(
      screen.getByText('Check the filter plate is seated on the vacuum collar')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "A proper seal with the gasket is needed to ensure consistent vacuum and even flow across wells. If the plate isn't flush, the target vacuum level can't be reached."
      )
    ).toBeInTheDocument()
  })
})
