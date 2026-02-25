import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { VacuumCheckTubeConnections } from '../VacuumCheckTubeConnections'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof VacuumCheckTubeConnections>) => {
  return renderWithProviders(<VacuumCheckTubeConnections {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumCheckTubeConnections', () => {
  let props: ComponentProps<typeof VacuumCheckTubeConnections>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders the VacuumCheckTubeConnections component with the correct props', () => {
    render(props)

    expect(screen.getByText('Check all tube connections')).toBeInTheDocument()
    expect(
      screen.getByText(
        'All tubes must be securely connected to to maintain an airtight seal.'
      )
    ).toBeInTheDocument()

    const notification = screen.getByTestId('InlineNotification_alert')
    expect(notification).toHaveTextContent(
      'Push the tube in until it clicks into place.'
    )
  })
})
