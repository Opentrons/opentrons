import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

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
    const { getByText } = render(props)
    getByText('Connect to a Robot via IP Address')
    getByText('Enter an IP address or hostname to connect to a robot.')
    getByText(
      'Opentrons recommends working with your network administrator to assign a static IP address to the robot.'
    )
    getByText('Learn more about connecting a robot manually')

    getByText('Add IP Address or Hostname')
  })

  it('renders the Add button, Done button, and input form', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Add' })
    getByRole('button', { name: 'Done' })
    expect(getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the link and it has the correct href attribute', () => {
    const { getByText } = render(props)
    const targetLink =
      'https://support.opentrons.com/s/article/Manually-adding-a-robot-s-IP-address'
    const link = getByText('Learn more about connecting a robot manually')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('Clicking Add button without IP address/hostname should display an error message', async () => {
    const { getByRole, findByText } = render(props)
    const addButton = getByRole('button', { name: 'Add' })
    expect(addButton).toBeEnabled()
    await fireEvent.click(addButton)
    const errorMessage = await findByText('Enter an IP Address or Hostname')
    expect(errorMessage).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname', async () => {
    const { getByRole, getByText, queryByText } = render(props)
    const newIpAddress = 'localhost'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(async () => {
      await fireEvent.change(inputBox, { target: { value: newIpAddress } })
      await fireEvent.click(addButton)
    })

    getByText(newIpAddress)
    getByText('Searching for 30s')
    expect(queryByText('Available')).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Available label', async () => {
    const { getByRole, getByText, queryByText } = render(props)
    const availableIpAddress = '192.168.1.1'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(async () => {
      await fireEvent.change(inputBox, {
        target: { value: availableIpAddress },
      })
      await fireEvent.click(addButton)
    })
    getByText(availableIpAddress)
    queryByText('Available')
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Not Found label', async () => {
    const { getByRole, findByText } = render(props)
    const notFoundIpAddress = '1.1.1.2'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(async () => {
      await fireEvent.change(inputBox, {
        target: { value: notFoundIpAddress },
      })
      await fireEvent.click(addButton)
    })
    findByText(notFoundIpAddress)
    findByText('Not Found')
  })

  it('Clicking Close button in a row should remove an IP address/hostname', async () => {
    const { queryByText, getByRole, getAllByTestId } = render(props)
    const targetIpAddress = 'test'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(async () => {
      fireEvent.change(inputBox, { target: { value: targetIpAddress } })
      fireEvent.click(addButton)
    })
    const removeButtons = getAllByTestId('close-button')
    const btnLength = removeButtons.length
    fireEvent.click(removeButtons[btnLength - 1])
    expect(queryByText(targetIpAddress)).toBeFalsy()
  })

  it('Clicking close button should close the slideout', async () => {
    const { getByTestId } = render(props)
    const closeButton = getByTestId(
      'Slideout_icon_close_Connect to a Robot via IP Address'
    )
    await fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('Clicking Done button should close the slideout', async () => {
    const { getByRole } = render(props)
    const doneButton = getByRole('button', { name: 'Done' })
    await fireEvent.click(doneButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
