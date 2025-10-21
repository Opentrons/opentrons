import * as auth0 from '@auth0/auth0-react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { Footer } from '/ai-client/components/molecules/Footer'
import { Header } from '/ai-client/components/molecules/Header'
import { HeaderWithMeter } from '/ai-client/components/molecules/HeaderWithMeter'
import { Loading } from '/ai-client/components/molecules/Loading'

import { renderWithProviders } from './__testing-utils__'
import { i18n } from './i18n'
import { OpentronsAI } from './OpentronsAI'
import { Landing } from './pages/Landing'
import { headerWithMeterAtom } from './resources/atoms'
import { useGetAccessToken } from './resources/hooks'

vi.mock('@auth0/auth0-react')

vi.mock('./pages/Landing')
vi.mock('/ai-client/components/molecules/Header')
vi.mock('/ai-client/components/molecules/HeaderWithMeter')
vi.mock('/ai-client/components/molecules/Footer')
vi.mock('/ai-client/components/molecules/Loading')
vi.mock('./resources/hooks/useGetAccessToken')
vi.mock('./analytics/mixpanel')

const mockUseTrackEvent = vi.fn()

vi.mock('./resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

const initialValues: Array<[any, any]> = [
  [headerWithMeterAtom, { displayHeaderWithMeter: false, progress: 0 }],
]

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OpentronsAI />, {
    i18nInstance: i18n,
    initialValues,
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
    render()

    screen.getByText('mock Header component')
  })

  it('should render Header with meter component if displayHeaderWithMeter is true', () => {
    initialValues[0][1].displayHeaderWithMeter = true

    render()

    screen.getByText('mock Header With Meter component')
  })

  it('should render Footer component', () => {
    render()
    screen.getByText('mock Footer component')
  })
})
