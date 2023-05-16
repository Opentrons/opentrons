import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { ProtocolCard } from '../'

import type { ProtocolResource } from '@opentrons/shared-data'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  metadata: {
    protocolName: 'yay mock protocol',
    author: 'engineering',
    description: 'A short mock protocol',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const props = { protocol: mockProtocol, longPress: jest.fn() }

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolCard', () => {
  jest.useFakeTimers()

  it('should redirect to protocol details after short click', () => {
    const [{ getByText }] = render()
    const name = getByText('yay mock protocol')
    fireEvent.click(name)
    expect(mockPush).toHaveBeenCalledWith('/protocols/mockProtocol1')
  })

  it('should display modal after long click', async () => {
    const [{ getByText }] = render()
    const name = getByText('yay mock protocol')
    fireEvent.mouseDown(name)
    jest.advanceTimersByTime(1005)
    expect(props.longPress).toHaveBeenCalled()
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
  })
})
