import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_JUPYTER_OPEN,
} from '../../../../../redux/analytics'
import { OpenJupyterControl } from '../OpenJupyterControl'

jest.mock('../../../../../redux/analytics')

const mockUseTrackEvent = useTrackEvent as jest.Mock<typeof useTrackEvent>

const mockIpAddress = '1.1.1.1'
const mockLink = `http://${mockIpAddress}:48888`
const trackEvent = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <OpenJupyterControl robotIp={mockIpAddress} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings OpenJupyterControl', () => {
  beforeEach(() => {
    mockUseTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and button', () => {
    render()
    screen.getByText('Jupyter Notebook')
    screen.getByText(
      'Open the Jupyter Notebook running on this robot in the web browser. This is an experimental feature.'
    )
    screen.getByText('Learn more about using Jupyter notebook')
    screen.getByText('Launch Jupyter Notebook')
    expect(
      screen.getByRole('link', { name: 'Launch Jupyter Notebook' })
    ).toBeInTheDocument()
  })

  it('should render jupyter notebook link', () => {
    render()
    const link = screen.getByRole('link', {name: 'Launch Jupyter Notebook'})
    expect(link).toHaveAttribute('href', mockLink)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should send and analytics event on link click', () => {
    const [{ getByRole }] = render()
    const button = getByRole('link', { name: 'Launch Jupyter Notebook' })
    fireEvent.click(button)
    expect(trackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_JUPYTER_OPEN,
      properties: {},
    })
  })
})
