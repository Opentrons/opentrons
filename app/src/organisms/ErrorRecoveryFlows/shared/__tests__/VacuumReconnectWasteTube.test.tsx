import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { VacuumReconnectWasteTube } from '../VacuumReconnectWasteTube'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof VacuumReconnectWasteTube>) => {
  return renderWithProviders(<VacuumReconnectWasteTube {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumReconnectWasteTube', () => {
  let props: ComponentProps<typeof VacuumReconnectWasteTube>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders the VacuumReconnectWasteTube component with the correct props', () => {
    render(props)

    expect(
      screen.getByText('Reconnect the waste tube to the carboy')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'A secure connection is needed to maintain vacuum pressure.'
      )
    ).toBeInTheDocument()
  })
})
