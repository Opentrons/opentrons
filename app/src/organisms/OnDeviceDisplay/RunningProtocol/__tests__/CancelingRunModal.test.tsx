import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { CancelingRunModal } from '../CancelingRunModal'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <CancelingRunModal />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CancelingRunModal', () => {
  it('should render text and icon', () => {
    const [{ getByText, getByLabelText }] = render()
    getByText('Canceling run...')
    getByLabelText('CancelingRunModal_icon')
  })
})
