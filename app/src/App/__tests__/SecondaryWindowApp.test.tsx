import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { LocalizationProvider } from '/app/LocalizationProvider'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { LivestreamViewer } from '/app/pages/Desktop/LivestreamViewer'
import { useRobot } from '/app/redux-resources/robots'

import { SecondaryWindowApp } from '../SecondaryWindowApp'

import type { LocalizationProviderProps } from '/app/LocalizationProvider'

vi.mock('/app/LocalizationProvider')
vi.mock('/app/pages/Desktop/LivestreamViewer')
vi.mock('/app/redux-resources/robots')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <SecondaryWindowApp />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('SecondaryWindowApp', () => {
  beforeEach(() => {
    vi.mocked(LivestreamViewer).mockReturnValue(
      <div>Mock LivestreamViewer</div>
    )
    vi.mocked(useRobot).mockReturnValue({
      name: 'otie',
      ip: '192.168.1.100',
    } as any)
    vi.mocked(
      LocalizationProvider
    ).mockImplementation((props: LocalizationProviderProps) => (
      <>{props.children}</>
    ))
  })

  it('renders a LivestreamViewer component from /devices/:robotName/camera-stream', () => {
    render('/devices/otie/camera-stream')
    screen.getByText('Mock LivestreamViewer')
  })

  it('navigates to home on unknown routes', () => {
    render('/unknown-route')
    expect(window.location.pathname).toBe('/')
  })
})
