import * as React from 'react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'
import { when } from 'vitest-when'
import { screen } from '@testing-library/react'

import { i18n } from '../../i18n'
import { getIsOnDevice, getConfig } from '../../redux/config'

import { DesktopApp } from '../DesktopApp'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'
import { App } from '../'

import type { State } from '../../redux/types'
import { renderWithProviders } from '../../__testing-utils__'

vi.mock('../../redux/config')
vi.mock('../DesktopApp')
vi.mock('../OnDeviceDisplayApp')

const MOCK_STATE: State = {
  config: {
    isOnDevice: true,
  },
} as any

const render = () => {
  return renderWithProviders(<App />, {
    i18nInstance: i18n,
    initialState: MOCK_STATE,
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(DesktopApp).mockReturnValue(<div>mock DesktopApp</div>)
    vi.mocked(OnDeviceDisplayApp).mockReturnValue(<div>mock OnDeviceDisplayApp</div>)
    when(vi.mocked(getConfig))
      .calledWith(MOCK_STATE)
      .thenReturn(MOCK_STATE.config)
    when(vi.mocked(getIsOnDevice)).calledWith(MOCK_STATE).thenReturn(false)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders null before config initializes', () => {
    when(vi.mocked(getConfig)).calledWith(MOCK_STATE).thenReturn(null)
    const [{ container }] = render()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a DesktopApp component when not on device', () => {
    when(vi.mocked(getIsOnDevice)).calledWith(MOCK_STATE).thenReturn(false)
    render()
    screen.getByText('mock DesktopApp')
  })

  it('renders an OnDeviceDisplayApp component when on device', () => {
    when(vi.mocked(getIsOnDevice)).calledWith(MOCK_STATE).thenReturn(true)
    render()
    screen.getByText('mock OnDeviceDisplayApp')
  })
})
