import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { initializeSentry } from '/app/App/sentry'
import { i18n } from '/app/i18n'
import { getConfig } from '/app/redux/config'

import { App } from '../'
import { DesktopApp } from '../DesktopApp'
import { useWindowType } from '../hooks/useWindowType'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'
import { SecondaryWindowApp } from '../SecondaryWindowApp'

import type { Mock } from 'vitest'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/config')
vi.mock('../DesktopApp')
vi.mock('../hooks/useWindowType')
vi.mock('../OnDeviceDisplayApp')
vi.mock('../SecondaryWindowApp')
vi.mock('/app/App/sentry')

const MOCK_STATE: State = {
  config: {
    isOnDevice: true,
    analytics: { optedIn: true },
  },
} as any

const render = () => {
  return renderWithProviders(<App />, {
    i18nInstance: i18n,
    initialState: MOCK_STATE,
  })
}

let mockInitSentry: Mock

describe('App', () => {
  beforeEach(() => {
    mockInitSentry = vi.fn()
    vi.mocked(DesktopApp).mockReturnValue(<div>mock DesktopApp</div>)
    vi.mocked(OnDeviceDisplayApp).mockReturnValue(
      <div>mock OnDeviceDisplayApp</div>
    )
    vi.mocked(SecondaryWindowApp).mockReturnValue(
      <div>mock SecondaryWindowApp</div>
    )
    vi.mocked(initializeSentry).mockImplementation(mockInitSentry)
    vi.mocked(useWindowType).mockReturnValue('desktop-main')
    when(vi.mocked(getConfig))
      .calledWith(MOCK_STATE)
      .thenReturn(MOCK_STATE.config)
  })

  it('renders null before config initializes', () => {
    when(vi.mocked(getConfig)).calledWith(MOCK_STATE).thenReturn(null)
    const [{ container }] = render()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a SecondaryWindowApp component when window type is secondary', () => {
    vi.mocked(useWindowType).mockReturnValue('secondary')

    render()

    screen.getByText('mock SecondaryWindowApp')
  })

  it('renders a DesktopApp component when not on device and window type is main', () => {
    render()

    screen.getByText('mock DesktopApp')
  })

  it('renders an OnDeviceDisplayApp component when on device and window type is main', () => {
    vi.mocked(useWindowType).mockReturnValue('odd-main')

    render()

    screen.getByText('mock OnDeviceDisplayApp')
  })

  it('initializes sentry if config is defined', () => {
    render()

    expect(mockInitSentry).toHaveBeenCalledWith(
      MOCK_STATE.config?.analytics.optedIn
    )
  })
})
