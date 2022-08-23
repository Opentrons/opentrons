import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { HeaterShakerError } from '../HeaterShakerError'

const render = (props: React.ComponentProps<typeof HeaterShakerError>) => {
  return renderWithProviders(<HeaterShakerError {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerError', () => {
  let props: React.ComponentProps<typeof HeaterShakerError>
  beforeEach(() => {
    props = {
      errorDetails: 'string',
    }
  })

  it('renders an error banner and clicking on the button renders the modal', () => {
    const { getByText, getByRole } = render(props)
    getByText('Module error')
    const btn = getByRole('button', { name: 'View error details' })
    fireEvent.click(btn)
    getByText('Heater-Shaker module error')
    getByText(
      'Try power-cycling the module. If the error persists, please contact support.'
    )
    const close = getByRole('button', { name: 'close' })
    fireEvent.click(close)
    expect(screen.queryByText('Heater-Shaker module error')).toBeNull()
  })
})
