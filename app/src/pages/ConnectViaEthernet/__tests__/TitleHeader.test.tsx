import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { TitleHeader } from '../../../pages/ConnectViaEthernet/TitleHeader'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof TitleHeader>) => {
  return renderWithProviders(<TitleHeader {...props} />)
}

describe('TitleHeader', () => {
  let props: React.ComponentProps<typeof TitleHeader>

  beforeEach(() => {
    props = {
      title: 'Ethernet',
    }
  })

  it('should render text and button', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Ethernet')
    getByTestId('Ethernet_header_back_button')
  })

  it('should call a mock function when tapping back button', () => {
    const [{ getByTestId }] = render(props)
    fireEvent.click(getByTestId('Ethernet_header_back_button'))
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })
})
