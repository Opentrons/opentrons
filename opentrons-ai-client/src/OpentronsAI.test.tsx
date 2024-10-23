import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import * as auth0 from '@auth0/auth0-react'

import { renderWithProviders } from './__testing-utils__'
import { i18n } from './i18n'
import { Loading } from './molecules/Loading'

import { OpentronsAI } from './OpentronsAI'
import { Landing } from './pages/Landing'
import { useGetAccessToken } from './resources/hooks'
import { Header } from './molecules/Header'
import { Footer } from './molecules/Footer'
import { HeaderWithMeter } from './molecules/HeaderWithMeter'
import { TestProvider } from './resources/utils/testUtils'
import { headerWithMeterAtom } from './resources/atoms'

vi.mock('@auth0/auth0-react')

vi.mock('./pages/Landing')
vi.mock('./molecules/Header')
vi.mock('./molecules/HeaderWithMeter')
vi.mock('./molecules/Footer')
vi.mock('./molecules/Loading')
vi.mock('./resources/hooks/useGetAccessToken')
vi.mock('./analytics/mixpanel')

const mockUseTrackEvent = vi.fn()

vi.mock('./resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OpentronsAI />, {
    i18nInstance: i18n,
  })
}

describe('OpentronsAI', () => {
  beforeEach(() => {
    vi.mocked(useGetAccessToken).mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('mock access token'),
    })
    vi.mocked(Landing).mockReturnValue(<div>mock Landing page</div>)
    vi.mocked(Loading).mockReturnValue(<div>mock Loading</div>)
    vi.mocked(Header).mockReturnValue(<div>mock Header component</div>)
    vi.mocked(HeaderWithMeter).mockReturnValue(
      <div>mock Header With Meter component</div>
    )
    vi.mocked(Footer).mockReturnValue(<div>mock Footer component</div>)
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('should render loading screen when isLoading is true', () => {
    ;(auth0 as any).useAuth0 = vi.fn().mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })
    render()
    screen.getByText('mock Loading')
  })

  it('should render text', () => {
    render()
    screen.getByText('mock Landing page')
  })

  it('should render the default Header component if displayHeaderWithMeter is false', () => {
    renderWithProviders(
      <TestProvider
        initialValues={[
          [headerWithMeterAtom, { displayHeaderWithMeter: false, progress: 0 }],
        ]}
      >
        <OpentronsAI />
      </TestProvider>,
      {
        i18nInstance: i18n,
      }
    )

    screen.getByText('mock Header component')
  })

  it('should render Header with meter component if displayHeaderWithMeter is true', () => {
    renderWithProviders(
      <TestProvider
        initialValues={[
          [headerWithMeterAtom, { displayHeaderWithMeter: true, progress: 0 }],
        ]}
      >
        <OpentronsAI />
      </TestProvider>,
      {
        i18nInstance: i18n,
      }
    )

    screen.getByText('mock Header With Meter component')
  })

  it('should render Footer component', () => {
    render()
    screen.getByText('mock Footer component')
  })
})
