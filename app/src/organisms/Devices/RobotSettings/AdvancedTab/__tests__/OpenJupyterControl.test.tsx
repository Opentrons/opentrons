import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
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

const render = (props: React.ComponentProps<typeof OpenJupyterControl>) => {
  return renderWithProviders(
    <MemoryRouter>
      <OpenJupyterControl {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings OpenJupyterControl', () => {
  let props: React.ComponentProps<typeof OpenJupyterControl>
  beforeEach(() => {
    props = {
      robotIp: mockIpAddress,
      isEstopNotDisengaged: false,
    }
    mockUseTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and button', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Jupyter Notebook')
    getByText(
      'Open the Jupyter Notebook running on this robot in the web browser. This is an experimental feature.'
    )
    getByText('Learn more about using Jupyter notebook')
    getByText('Launch Jupyter Notebook')
    expect(
      getByRole('button', { name: 'Launch Jupyter Notebook' })
    ).toBeInTheDocument()
  })

  it('should render jupyter notebook link', () => {
    const [{ getByRole }] = render(props)
    const link = getByRole('button', { name: 'Launch Jupyter Notebook' })
    console.log(link)
    expect(link).toHaveAttribute('href', mockLink)
  })

  it('should send and analytics event on link click', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Launch Jupyter Notebook' })
    fireEvent.click(button)
    expect(trackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_JUPYTER_OPEN,
      properties: {},
    })
  })

  it('should render disabled button when e-stop button is pressed', () => {
    props = { ...props, isEstopNotDisengaged: true }
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Launch Jupyter Notebook' })
    expect(button).toBeDisabled()
  })
})
