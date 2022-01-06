import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DevicesEmptyState } from '../../../../organisms/Devices/DevicesEmptyState'
import { Scanning } from '../../../../organisms/Devices/Scanning'
import { getScanning } from '../../../../redux/discovery'
import { DevicesLanding } from '..'

jest.mock('../../../../organisms/Devices/DevicesEmptyState')
jest.mock('../../../../organisms/Devices/Scanning')
jest.mock('../../../../redux/discovery')

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>

const mockScanning = Scanning as jest.MockedFunction<typeof Scanning>

const mockDevicesEmptyState = DevicesEmptyState as jest.MockedFunction<
  typeof DevicesEmptyState
>

const render = () => {
  return renderWithProviders(<DevicesLanding />, {
    i18nInstance: i18n,
  })
}

describe('DevicesLanding', () => {
  beforeEach(() => {
    mockGetScanning.mockReturnValue(false)
    mockScanning.mockReturnValue(<div>Mock Scanning</div>)
    mockDevicesEmptyState.mockReturnValue(<div>Mock DevicesEmptyState</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a Devices title', () => {
    const [{ getByText }] = render()

    expect(getByText('Devices')).toBeTruthy()
  })

  it('renders a Scanning component when scanning for robots', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ getByText }] = render()

    expect(getByText('Mock Scanning')).toBeTruthy()
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    const [{ getByText }] = render()

    expect(getByText('Mock DevicesEmptyState')).toBeTruthy()
  })
})
