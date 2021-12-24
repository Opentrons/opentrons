import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'

import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { AppSettings } from '../../pages/More/AppSettings'
import { NextGenApp } from '../NextGenApp'

jest.mock('../../pages/Devices/DevicesLanding')
jest.mock('../../pages/More/AppSettings')

const mockDevicesLanding = DevicesLanding as jest.MockedFunction<
  typeof DevicesLanding
>
mockDevicesLanding.mockReturnValue(<div>Mock DevicesLanding</div>)
const mockAppSettings = AppSettings as jest.MockedFunction<typeof AppSettings>
mockAppSettings.mockReturnValue(<div>Mock AppSettings</div>)

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <NextGenApp />
    </MemoryRouter>
  )
}

describe('NextGenApp', () => {
  it('renders an AppSettings component', () => {
    const [{ getByText }] = render('/app-settings/feature-flags')
    expect(getByText('Mock AppSettings')).toBeTruthy()
  })

  it('renders a DevicesLanding component from /robots', () => {
    const [{ getByText }] = render('/robots')
    expect(getByText('Mock DevicesLanding')).toBeTruthy()
  })

  it('renders an AppSettings component from /more', () => {
    const [{ getByText }] = render('/more')
    expect(getByText('Mock AppSettings')).toBeTruthy()
  })
})
