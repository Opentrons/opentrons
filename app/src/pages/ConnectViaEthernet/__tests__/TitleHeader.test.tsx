import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { TitleHeader } from '../../../pages/ConnectViaEthernet/TitleHeader'

import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
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
    render(props)
    screen.getByText('Ethernet')
    screen.getByTestId('Ethernet_header_back_button')
  })

  it('should call a mock function when tapping back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('Ethernet_header_back_button'))
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })
})
