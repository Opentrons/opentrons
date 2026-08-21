import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ANALYTICS_JUPYTER_OPEN, useTrackEvent } from '/app/redux/analytics'

import { OpenJupyterControl } from '../OpenJupyterControl'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/analytics')
vi.mock('@opentrons/react-api-client')

const mockAccessControlEnabledQuery = (
  value: Partial<ReturnType<typeof useAccessControlEnabledQuery>>
): void => {
  vi.mocked(useAccessControlEnabledQuery).mockReturnValue(
    value as ReturnType<typeof useAccessControlEnabledQuery>
  )
}

const mockIpAddress = '1.1.1.1'
const mockLink = `http://${mockIpAddress}:48888`
const trackEvent = vi.fn()

global.window = Object.create(window)
Object.defineProperty(window, 'open', { writable: true, configurable: true })
window.open = vi.fn()

const render = (props: ComponentProps<typeof OpenJupyterControl>) => {
  return renderWithProviders(
    <MemoryRouter>
      <OpenJupyterControl {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings OpenJupyterControl', () => {
  let props: ComponentProps<typeof OpenJupyterControl>
  beforeEach(() => {
    props = {
      robotIp: mockIpAddress,
      isEstopNotDisengaged: false,
    }
    vi.mocked(useTrackEvent).mockReturnValue(trackEvent)
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: false } },
      isLoading: false,
      isSuccess: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render title, description and button', () => {
    render(props)
    screen.getByText('Jupyter Notebook')
    screen.getByText(
      'Open the Jupyter Notebook running on this robot in the web browser. This is an experimental feature.'
    )
    screen.getByText('Learn more about using Jupyter notebook')
    screen.getByText('Launch Jupyter Notebook')
    expect(
      screen.getByRole('button', { name: 'Launch Jupyter Notebook' })
    ).toBeInTheDocument()
  })

  it('should render jupyter notebook button', () => {
    render(props)
    const button = screen.getByRole('button', {
      name: 'Launch Jupyter Notebook',
    })
    fireEvent.click(button)
    expect(window.open).toHaveBeenCalledWith(mockLink, '_blank')
  })

  it('should send and analytics event on button click', () => {
    render(props)
    const button = screen.getByRole('button', {
      name: 'Launch Jupyter Notebook',
    })
    fireEvent.click(button)
    expect(trackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_JUPYTER_OPEN,
      properties: {},
    })
  })

  it('should render disabled button when e-stop button is pressed', () => {
    props = { ...props, isEstopNotDisengaged: true }
    render(props)
    const button = screen.getByRole('button', {
      name: 'Launch Jupyter Notebook',
    })
    expect(button).toBeDisabled()
  })

  it('should disable the button when access control is enabled', () => {
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: true } },
      isLoading: false,
      isSuccess: true,
    })
    render(props)
    expect(
      screen.getByRole('button', { name: 'Launch Jupyter Notebook' })
    ).toBeDisabled()
  })
})
