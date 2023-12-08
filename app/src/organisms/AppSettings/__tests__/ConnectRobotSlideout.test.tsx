import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getScanning, getViewableRobots } from '../../../redux/discovery'
import { getConfig } from '../../../redux/config'
import { ConnectRobotSlideout } from '../ConnectRobotSlideout'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/config')

const render = (props: React.ComponentProps<typeof ConnectRobotSlideout>) => {
  return renderWithProviders(<ConnectRobotSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockGetViewableRobots = getViewableRobots as jest.MockedFunction<
  typeof getViewableRobots
>

describe('ConnectRobotSlideout', () => {
  let props: React.ComponentProps<typeof ConnectRobotSlideout>

  beforeEach(() => {
    mockGetScanning.mockReturnValue(true)

    mockGetConfig.mockReturnValue({
      discovery: {
        candidates: ['1.1.1.1', 'localhost', '192.168.1.1'],
      },
    } as any)
    mockGetViewableRobots.mockReturnValue([
      {
        name: 'other-robot-name',
        host: '1.1.1.1',
        port: 31950,
      },
      {
        name: 'test-robot-name',
        host: 'localhost',
        port: 31950,
      },
      {
        name: 'opentrons',
        ip: '192.168.1.1',
        port: 31950,
        local: false,
        ok: false,
        serverOk: true,
      },
    ] as any[])

    props = {
      candidates: [],
      checkIpAndHostname: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    } as React.ComponentProps<typeof ConnectRobotSlideout>
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title, body, and footer for ConnectRobotSlideout', () => {
    render(props)
    screen.getByText('Connect to a Robot via IP Address')
    screen.getByText('Enter an IP address or hostname to connect to a robot.')
    screen.getByText(
      'Opentrons recommends working with your network administrator to assign a static IP address to the robot.'
    )
    screen.getByText('Learn more about connecting a robot manually')

    screen.getByText('Add IP Address or Hostname')
  })

  it('renders the Add button, Done button, and input form', () => {
    render(props)
    screen.getByRole('button', { name: 'Add' })
    screen.getByRole('button', { name: 'Done' })
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the link and it has the correct href attribute', () => {
    render(props)
    const targetLink =
      'https://support.opentrons.com/s/article/Manually-adding-a-robot-s-IP-address'
    const link = screen.getByText('Learn more about connecting a robot manually')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('Clicking Add button without IP address/hostname should display an error message', async () => {
    render(props)
    const addButton = screen.getByRole('button', { name: 'Add' })
    expect(addButton).toBeEnabled()
    fireEvent.click(addButton)
    const errorMessage = await screen.findByText('Enter an IP Address or Hostname')
    expect(errorMessage).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname', async () => {
    render(props)
    const newIpAddress = 'localhost'
    const inputBox = screen.getByRole('textbox')
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.change(inputBox, { target: { value: newIpAddress } })
    fireEvent.click(addButton)

    screen.getByText(newIpAddress)
    screen.getByText('Searching for 30s')
    expect(screen.queryByText('Available')).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Available label', async () => {
    render(props)
    const availableIpAddress = '192.168.1.1'
    const inputBox = screen.getByRole('textbox')
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.change(inputBox, {
      target: { value: availableIpAddress },
    })
    fireEvent.click(addButton)
    screen.getByText(availableIpAddress)
    screen.queryByText('Available')
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Not Found label', async () => {
    const { getByRole, findByText } = render(props)
    const notFoundIpAddress = '1.1.1.2'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    fireEvent.change(inputBox, {
      target: { value: notFoundIpAddress },
    })
    fireEvent.click(addButton)
    findByText(notFoundIpAddress)
    findByText('Not Found')
  })

  it('Clicking Close button in a row should remove an IP address/hostname', async () => {
    render(props)
    const targetIpAddress = 'test'
    const inputBox = screen.getByRole('textbox')
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.change(inputBox, { target: { value: targetIpAddress } })
    fireEvent.click(addButton)
    const removeButtons = screen.getAllByTestId('close-button')
    const btnLength = removeButtons.length
    fireEvent.click(removeButtons[btnLength - 1])
    expect(screen.queryByText(targetIpAddress)).toBeFalsy()
  })

  it('Clicking close button should close the slideout', async () => {
    render(props)
    const closeButton = screen.getByTestId(
      'Slideout_icon_close_Connect to a Robot via IP Address'
    )
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('Clicking Done button should close the slideout', async () => {
    render(props)
    const doneButton = screen.getByRole('button', { name: 'Done' })
    fireEvent.click(doneButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
