import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react-hooks'

import { renderWithProviders, useLongPress } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { TooManyPinsModal } from '../TooManyPinsModal'

import type { UseLongPressResult } from '@opentrons/components'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (longPress: UseLongPressResult) => {
  return renderWithProviders(
    <MemoryRouter>
      <TooManyPinsModal longpress={longPress} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Too Many Pins Modal', () => {
  it('should have a close button', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    getByText('Got it')
  })
})
