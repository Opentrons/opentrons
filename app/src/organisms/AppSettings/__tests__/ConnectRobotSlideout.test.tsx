import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { i18n } from '../../../i18n'
import { getScanning, getViewableRobots } from '../../../redux/discovery'
import { getConfig } from '../../../redux/config'
import { ConnectRobotSlideoutComponent } from '../ConnectRobotSlideout'

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
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockGetViewableRobots = getViewableRobots as jest.MockedFunction<
  typeof getViewableRobots
>

describe('ConnectRobotSlideout', () => {
  let props: React.ComponentProps<typeof ConnectRobotSlideoutComponent>

  beforeEach(() => {
    mockGetConfig.mockReturnValue({
      discovery: {
        candidates: ['192.168.1.1', '1.1.1.1', 'localhost'],
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
    mockGetConfig.mockReturnValue({
      discovery: {
        candidates: ['localhost'],
      },
    } as any)
    mockGetViewableRobots.mockReturnValue([
      {
        name: 'test-robot-name',
        host: 'localhost',
        port: 31950,
      },
    ] as any[])
    const { getByRole, getByText, queryByText } = render(props)
    const newIpAddress = 'localhost'
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    await act(async () => {
      await fireEvent.change(inputBox, { target: { value: newIpAddress } })
      await fireEvent.click(addButton)
    })

    expect(getByText(newIpAddress)).toBeInTheDocument()
    expect(queryByText('Available')).toBeFalsy()
    expect(queryByText('Not Found')).toBeFalsy()
  })

  // ok
  //   it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Available label', async () => {
  //     const { getByRole, getByText, queryByText } = render(props)
  //     const availableIpAddress = '192.168.1.1'
  //     const inputBox = getByRole('textbox')
  //     const addButton = getByRole('button', { name: 'Add' })
  //     await act(async () => {
  //       await fireEvent.change(inputBox, {
  //         target: { value: availableIpAddress },
  //       })
  //       await fireEvent.click(addButton)
  //     })
  //     expect(getByText(availableIpAddress)).toBeInTheDocument()
  //     expect(queryByText('Available')).toBeTruthy()
  //   })

  // ok
  //   it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Not Found label', async () => {
  //     const { getByRole, getByText } = render(props)
  //     const notFoundIpAddress = '1.1.1.1'
  //     const inputBox = getByRole('textbox')
  //     const addButton = getByRole('button', { name: 'Add' })
  //     await act(async () => {
  //       await fireEvent.change(inputBox, {
  //         target: { value: notFoundIpAddress },
  //       })
  //       await fireEvent.click(addButton)
  //     })
  //     expect(getByText(notFoundIpAddress)).toBeInTheDocument()
  //     expect(getByText('Not Found')).toBeInTheDocument()
  //   })

  //   it('Clicking Close button in a row should remove an IP address/hostname', async () => {
  //     const { getByRole, queryByText, getByLabelText } = render(props)
  //     const newIpAddress = '1.1.1.1'
  //     const inputBox = getByRole('textbox')
  //     const addButton = getByRole('button', { name: 'Add' })
  //     // const removeButton = getByTestId('ip-remove-button')
  //     await act(async () => {
  //       await fireEvent.change(inputBox, { target: { value: newIpAddress } })
  //       await fireEvent.click(addButton)
  //     })

  //     // const removeButton = getByRole('button', { name: /ip-close-button/i })
  //     // const removeButton = await getByTestId('close-button')
  //     const removeButton = await getByLabelText('close')
  //     await fireEvent.click(removeButton)

  //     expect(queryByText(newIpAddress)).toBeFalsy()
  //     // expect(queryByText('Available')).toBeFalsy()
  //     // expect(queryByText('Not Found')).toBeFalsy()
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
