import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { TooManyPinsModal } from '../TooManyPinsModal'

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <TooManyPinsModal handleCloseMaxPinsAlert={() => {}} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Too Many Pins Modal', () => {
  it('should have a close button', () => {
    const [{ getByText }] = render()
    getByText('close')
  })
})
