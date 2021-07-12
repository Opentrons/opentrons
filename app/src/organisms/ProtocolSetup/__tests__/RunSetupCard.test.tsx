import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'

import { i18n } from '../../../i18n'
import { RunSetupCard } from '../RunSetupCard'

import * as protocolSelectors from '../../../redux/protocol/selectors'

jest.mock('../../../redux/protocol/selectors')
const getProtocolData = protocolSelectors.getProtocolData as jest.MockedFunction<
  typeof protocolSelectors.getProtocolData
>

describe('RunSetupCard', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    getProtocolData.mockReturnValue(noModulesProtocol as any)
    render = () => {
      return renderWithProviders(<RunSetupCard />, { i18nInstance: i18n })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders robot calibration and labware setup if no modules in protocol', () => {
    const { queryByText } = render()
    expect(queryByText(/module setup/i)).toBeNull()
  })
  it('renders robot calibration, modules, and labware setup if some modules in protocol', () => {
    getProtocolData.mockReturnValue(withModulesProtocol as any)
    const { getByText } = render()
    expect(getByText('Module Setup')).toBeTruthy()
  })
  it('renders null if python protocol with only metadata field', () => {
    getProtocolData.mockReturnValue({ metadata: {} as any })
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('renders correct text contents', () => {
    getProtocolData.mockReturnValue(withModulesProtocol as any)
    const { getByRole, getByText } = render()
    expect(getByRole('heading', { name: 'Setup for Run' })).toBeTruthy()
    expect(getByRole('heading', { name: 'STEP 1' })).toBeTruthy()
    expect(getByRole('heading', { name: 'Robot Calibration' })).toBeTruthy()
    expect(
      getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
    ).toBeTruthy()
    expect(getByRole('heading', { name: 'STEP 2' })).toBeTruthy()
    expect(getByRole('heading', { name: 'Labware Setup' })).toBeTruthy()
    expect(
      getByText(
        'Position full tip racks and labware in the deck slots as shown in the deck map.'
      )
    ).toBeTruthy()
    expect(getByRole('heading', { name: 'STEP 3' })).toBeTruthy()
    expect(getByRole('heading', { name: 'Module Setup' })).toBeTruthy()
    expect(
      getByText(
        'Plug in and power up the required module(s) via the OT-2 USB Port(s). Place the module(s) as shown in the deck map.'
      )
    ).toBeTruthy()
  })
})
