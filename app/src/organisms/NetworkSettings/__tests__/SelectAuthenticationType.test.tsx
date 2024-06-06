import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { getNetworkInterfaces, INTERFACE_WIFI } from '../../../redux/networking'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import { AlternativeSecurityTypeModal } from '../AlternativeSecurityTypeModal'
import { SelectAuthenticationType } from '../SelectAuthenticationType'
import { SetWifiCred } from '../SetWifiCred'

import type { useHistory } from 'react-router-dom'

const mockPush = vi.fn()
const mockSetSelectedAuthType = vi.fn()

vi.mock('../SetWifiCred')
vi.mock('../../../redux/networking')
vi.mock('../../../redux/discovery/selectors')
vi.mock('../AlternativeSecurityTypeModal')
vi.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: INTERFACE_WIFI,
}

const render = (
  props: React.ComponentProps<typeof SelectAuthenticationType>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <SelectAuthenticationType {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SelectAuthenticationType', () => {
  let props: React.ComponentProps<typeof SelectAuthenticationType>
  beforeEach(() => {
    props = {
      selectedAuthType: 'wpa-psk',
      setSelectedAuthType: mockSetSelectedAuthType,
    }
    vi.mocked(getNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    vi.mocked(SetWifiCred).mockReturnValue(<div>Mock SetWifiCred</div>)
    vi.mocked(AlternativeSecurityTypeModal).mockReturnValue(
      <div>mock AlternativeSecurityTypeModal</div>
    )
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(true)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('WPA2 Personal')
    screen.getByText('Most labs use this method')
    screen.getByText('None')
    screen.getByText('Not recommended')
    screen.getByText('Your MAC Address is WI:FI:00:00:00:00')
    screen.getByText('Need another security type?')
  })

  it('should render AlternativeSecurityTypeModal when tapping need another security type? button', () => {
    render(props)
    fireEvent.click(screen.getByText('Need another security type?'))
    screen.getByText('mock AlternativeSecurityTypeModal')
  })
})
