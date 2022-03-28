import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { i18n } from '../../../i18n'
// import { AppSettings } from '..'
import { getScanning } from '../../../redux/discovery'
// import { GeneralSettings } from '../GeneralSettings'
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
// const mockScanning = Scanning as jest.MockedFunction<typeof Scanning>

describe('ConnectRobotSlideout', () => {
  let props: React.ComponentProps<typeof ConnectRobotSlideoutComponent>
  //   let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockGetScanning.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  /*
  it('Clicking Set up connection button should display ConnectRobotSlideout', () => {
    // render GeneralSettings
    // clicking Set up connection button
    // display ConnectRobotSlideout
  })
  */

  it('renders correct title, body, and footer for ConnectRobotSlideout', () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)
    expect(getByText('Connect to Robot via IP Address')).toBeInTheDocument()
    expect(
      getByText('Enter an IP address or hostname to connect to a robot.')
    ).toBeInTheDocument()
    expect(
      getByText(
        'Opentrons recommends working with your network administrator to assign a static IP address to the robot.'
      )
    ).toBeInTheDocument()
    expect(
      getByText('Learn more about connecting a robot manually')
    ).toBeInTheDocument()
    expect(getByText('Add IP Address or Hostname')).toBeInTheDocument()
  })

  it('renders the Add button, Done button, and input form', () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole } = render(props)
    expect(getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the link and it has the correct href attribute', () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)
    const targetLink =
      'https://support.opentrons.com/en/articles/2934336-manually-adding-a-robot-s-ip-address'
    const link = getByText('Learn more about connecting a robot manually')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('Clicking Add button without IP address/hostname should display an error message', async () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }

    const { getByRole, findByText } = render(props)
    const addButton = getByRole('button', { name: 'Add' })
    expect(addButton).toBeEnabled()
    await fireEvent.click(addButton)
    const errorMessage = await findByText('Enter a IP Address or Hostname')
    expect(errorMessage).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname', async () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole, getByTestId } = render(props)
    // put ip address in input box 1.1.1.1
    // click add button
    // check that ip address is displayed
    const inputBox = getByRole('textbox')
    const addButton = getByRole('button', { name: 'Add' })
    act(async () => {
      fireEvent.change(inputBox, { target: { value: '1.1.1.1' } })
      fireEvent.click(addButton)
    })

    const addedIpAddress = await getByTestId('ip-hostname')
    // console.log('added value', addedIpAddress.textContent.values.ip)
    expect(addedIpAddress.textContent).toBeInTheDocument()
  })

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Available label', () => {})

  it('Clicking Add button with an IP address/hostname should display the IP address/hostname and Not Found label', () => {})

  it('Clicking close button should close the slideout', async () => {
    const handleClose = jest.fn()
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: handleClose,
    }
    const { getByTestId } = render(props)
    const closeButton = getByTestId(
      'Slideout_icon_close_Connect to Robot via IP Address'
    )
    await fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalled()
  })

  it('Clicking Done button should close the slideout', async () => {
    props = {
      candidates: [],
      checkIpAndHostnam: jest.fn(),
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const doneButton = getByRole('button', { name: 'Done' })
    await fireEvent.click(doneButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
