import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getConfig, getIsOnDevice } from '/app/redux/config'

import { App } from '../'
import { DesktopApp } from '../DesktopApp'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'

import type { State } from '/app/redux/types'

vi.mock('/app/redux/config')
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
    vi.mocked(OnDeviceDisplayApp).mockReturnValue(
      <div>mock OnDeviceDisplayApp</div>
    )
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
