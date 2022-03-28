import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { i18n } from '../../../i18n'
// import { AppSettings } from '..'
import { getScanning, getDiscoveredRobots } from '../../../redux/discovery'
// import { GeneralSettings } from '../GeneralSettings'
import { ConnectRobotSlideoutComponent } from '../ConnectRobotSlideout'
import type { DiscoveredRobot } from '../../../redux/discovery/types'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/config')

const render = (
  props: React.ComponentProps<typeof ConnectRobotSlideoutComponent>
) => {
  return renderWithProviders(<ConnectRobotSlideoutComponent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockGetConnectionStatus = getDiscoveredRobots as jest.MockedFunction<
  typeof getDiscoveredRobots
>

describe('ConnectRobotSlideout', () => {
  let props: React.ComponentProps<typeof ConnectRobotSlideoutComponent>
  //   let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockGetScanning.mockReturnValue(true)
    props = {
      candidates: [],
      checkIpAndHostname: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // oK
  //   it('renders correct title, body, and footer for ConnectRobotSlideout', () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }
  //     const { getByText } = render(props)
  //     expect(getByText('Connect to Robot via IP Address')).toBeInTheDocument()
  //     expect(
  //       getByText('Enter an IP address or hostname to connect to a robot.')
  //     ).toBeInTheDocument()
  //     expect(
  //       getByText(
  //         'Opentrons recommends working with your network administrator to assign a static IP address to the robot.'
  //       )
  //     ).toBeInTheDocument()
  //     expect(
  //       getByText('Learn more about connecting a robot manually')
  //     ).toBeInTheDocument()
  //     expect(getByText('Add IP Address or Hostname')).toBeInTheDocument()
  //   })

  // OK
  //   it('renders the Add button, Done button, and input form', () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }
  //     const { getByRole } = render(props)
  //     expect(getByRole('button', { name: 'Add' })).toBeInTheDocument()
  //     expect(getByRole('button', { name: 'Done' })).toBeInTheDocument()
  //     expect(getByRole('textbox')).toBeInTheDocument()
  //   })

  // oK
  //   it('renders the link and it has the correct href attribute', () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }
  //     const { getByText } = render(props)
  //     const targetLink =
  //       'https://support.opentrons.com/en/articles/2934336-manually-adding-a-robot-s-ip-address'
  //     const link = getByText('Learn more about connecting a robot manually')
  //     expect(link.closest('a')).toHaveAttribute('href', targetLink)
  //   })

  // OK
  //   it('Clicking Add button without IP address/hostname should display an error message', async () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }

  //     const { getByRole, findByText } = render(props)
  //     const addButton = getByRole('button', { name: 'Add' })
  //     expect(addButton).toBeEnabled()
  //     await fireEvent.click(addButton)
  //     const errorMessage = await findByText('Enter a IP Address or Hostname')
  //     expect(errorMessage).toBeInTheDocument()
  //   })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname', async () => {
    const { getByRole, getByText } = render(props)
    const newIpAddress = '1.1.1.1'
    const availableStatus: DiscoveredRobot = {
      displayName: 'test',
      connected: true,
      local: null,
      seen: true,
      status: 'connectable',
      health: {
        name: 'opentrons-dev',
        api_version: '5.0.2',
        fw_version: 'Virtual Smoothie',
        system_version: '0.0.0',
        logs: [],
        protocol_api_version: [0, 0],
        minimum_protocol_api_version: [2, 0],
        maximum_protocol_api_version: [2, 12],
      },
      ip: newIpAddress,
      port: 8080,
      healthStatus: 'ok',
      serverHealthStatus: 'ok',
    }

    mockGetConnectionStatus.mockReturnValue([availableStatus])
    // put ip address in input box 1.1.1.1
    // click add button
    // check that ip address is displayed
    // no Available no Not Found

    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(() => {
      fireEvent.change(inputBox, { target: { value: newIpAddress } })
      fireEvent.click(addButton)
    })

    expect(getByText(newIpAddress)).toBeInTheDocument()
    expect(getByText('Available')).not.toBeInTheDocument()
    expect(getByText('Not Found')).not.toBeInTheDocument()
  })

  //   it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Available label', () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }
  //     const { getByText } = render(props)
  //     const newIpAddress = '1.1.1.1'
  //     mockGetConnectionStatus.mockReturnValue(newIpAddress)
  //     // const newIpAddress = '1.1.1.1'
  //     expect(getByText(newIpAddress)).toBeInTheDocument()
  //     expect(getByText('Available')).toBeInTheDocument()
  //     expect(getByText('Not Found')).not.toBeInTheDocument()
  //   })

  //   it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Not Found label', () => {
  //     const newIpAddress = '1.1.1.1'
  //     expect(getByText('Available')).not.toBeInTheDocument()
  //     expect(getByText('Not Found')).toBeInTheDocument()
  //   })

  // OK
  //   it('Clicking close button should close the slideout', async () => {
  //     const handleClose = jest.fn()
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: handleClose,
  //     }
  //     const { getByTestId } = render(props)
  //     const closeButton = getByTestId(
  //       'Slideout_icon_close_Connect to Robot via IP Address'
  //     )
  //     await fireEvent.click(closeButton)
  //     expect(handleClose).toHaveBeenCalled()
  //   })

  // OK
  //   it('Clicking Done button should close the slideout', async () => {
  //     props = {
  //       candidates: [],
  //       checkIpAndHostname: jest.fn(),
  //       isExpanded: true,
  //       onCloseClick: jest.fn(),
  //     }
  //     const { getByRole } = render(props)
  //     const doneButton = getByRole('button', { name: 'Done' })
  //     await fireEvent.click(doneButton)
  //     expect(props.onCloseClick).toHaveBeenCalled()
  //   })
})
