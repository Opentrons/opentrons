import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react-hooks'

import { renderWithProviders, useLongPress } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { LongPressModal } from '../LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
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

const render = (longPress: UseLongPressResult) => {
  return renderWithProviders(
    <MemoryRouter>
      <LongPressModal longpress={longPress} protocol={mockProtocol} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Long Press Modal', () => {
  it('should display the three options', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
  })
})
