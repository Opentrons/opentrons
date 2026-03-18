import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { VacuumDisconnectEmptyCarboy } from '../VacuumDisconnectEmptyCarboy'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof VacuumDisconnectEmptyCarboy>) => {
  return renderWithProviders(<VacuumDisconnectEmptyCarboy {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumDisconnectEmptyCarboy', () => {
  let props: ComponentProps<typeof VacuumDisconnectEmptyCarboy>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders the VacuumDisconnectEmptyCarboy component with the correct props', () => {
    render(props)

    expect(
      screen.getByText('Disconnect the carboy and empty the waste')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Carefully unscrew the carboy cap and empty the waste into an appropriate disposal container.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Emptying the carboy regularly helps prevent overflows and maintain stable vacuum performance.'
      )
    ).toBeInTheDocument()
  })
})
