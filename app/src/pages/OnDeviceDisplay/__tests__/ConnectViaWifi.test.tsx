import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
// import * as Fixtures from '../../../redux/networking/__fixtures__'
// import { CONNECT } from '../../../organisms/Devices/RobotSettings/ConnectNetwork/constants'
import { DisplayWifiList } from '../../../organisms/SetupNetwork/DisplayWifiList'
import { SelectAuthenticationType } from '../../../organisms/SetupNetwork/SelectAuthenticationType'
import { SetWifiCred } from '../../../organisms/SetupNetwork/SetWifiCred'
import { ConnectingNetwork } from '../../../organisms/SetupNetwork/ConnectingNetwork'
import { SucceededToConnect } from '../../../organisms/SetupNetwork/SucceededToConnect'
import { FailedToConnect } from '../../../organisms/SetupNetwork/FailedToConnect'
import { ConnectViaWifi } from '../ConnectViaWifi'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/networking/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../organisms/SetupNetwork/DisplayWifiList')
jest.mock('../../../organisms/SetupNetwork/SelectAuthenticationType')
jest.mock('../../../organisms/SetupNetwork/SetWifiCred')
jest.mock('../../../organisms/SetupNetwork/ConnectingNetwork')
jest.mock('../../../organisms/SetupNetwork/SucceededToConnect')
jest.mock('../../../organisms/SetupNetwork/FailedToConnect')

// const mockState = {
//   showSelectAuthenticationType: true,
//   changeState: {
//     type: CONNECT,
//     ssid: 'mock ssid',
//     network: Fixtures.mockWifiNetwork,
//   },
// }
// const setHookState = (newState: any) =>
//   jest.fn().mockImplementation(() => [newState, () => {}])

// const reactMock = require('react')

const mockDisplayWifiList = DisplayWifiList as jest.MockedFunction<
  typeof DisplayWifiList
>
const mockSelectAuthenticationType = SelectAuthenticationType as jest.MockedFunction<
  typeof SelectAuthenticationType
>
const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>
const mockConnectingNetwork = ConnectingNetwork as jest.MockedFunction<
  typeof ConnectingNetwork
>
const mockSucceededToConnect = SucceededToConnect as jest.MockedFunction<
  typeof SucceededToConnect
>
const mockFailedToConnect = FailedToConnect as jest.MockedFunction<
  typeof FailedToConnect
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
// jest.mock('react', () => {
//   const actualReact = jest.requireActual('react')
//   return {
//     ...actualReact,
//     useState: jest.fn(),
//   }
// })
// const mockUseState = React.useState as jest.MockedFunction<
//   typeof React.useState
// >

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaWifi />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaWifi', () => {
  beforeEach(() => {
    mockGetRequestById.mockReturnValue(null)
    mockDisplayWifiList.mockReturnValue(<div>mock DisplayWifiList</div>)
    mockSelectAuthenticationType.mockReturnValue(
      <div>mock SelectAuthenticationType</div>
    )
    mockSetWifiCred.mockReturnValue(<div>mock SetWifiCred</div>)
    mockConnectingNetwork.mockReturnValue(<div>mock ConnectingNetwork</div>)
    mockSucceededToConnect.mockReturnValue(<div>mock SucceededToConnect</div>)
    mockFailedToConnect.mockReturnValue(<div>mock FailedToConnect</div>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render step meter 2/5 (width:40%)', () => {
    const [{ getByTestId }] = render()
    getByTestId('StepMeter_StepMeterContainer')
    const bar = getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 40%')
  })

  it('should render DisplayWifiList', () => {
    const [{ getByText }] = render()
    getByText('mock DisplayWifiList')
  })

  it('should render SelectAuthenticationType', () => {
    // ToDo kj 1/18/2023 Need to mock useState
    // const [{ getByText }] = render()
    // getByText('mock SelectAuthenticationType')
  })

  it('should render SetWifiCred', () => {
    // ToDo kj 1/18/2023 Need to mock useState
    // const [{ getByText }] = render()
    //   getByText('mock SetWifiCred')
  })

  it('should render ConnectingNetwork', () => {
    // ToDo kj 1/18/2023 Need to mock useState
    //   mockGetRequestById.mockReturnValue({
    //     status: RobotApi.PENDING,
    //   })
    //   const [{ getByText }] = render()
    //   getByText('mock ConnectingNetwork')
  })

  it('should render SucceededToConnect', () => {
    // ToDo kj 1/18/2023 Need to mock useState
    //   mockGetRequestById.mockReturnValue({
    //     status: RobotApi.SUCCESS,
    //     response: {} as any,
    //   })
    //   const [{ getByText }] = render()
    //   getByText('mock SucceededToConnect')
  })

  it('should render FailedToConnect', () => {
    // ToDo kj 1/18/2023 Need to mock useState
    //   mockGetRequestById.mockReturnValue({
    //     status: RobotApi.FAILURE,
    //     response: {} as any,
    //     error: { message: 'mock error' },
    //   })
    //   const [{ getByText }] = render()
    //   getByText('mock FailedToConnect')
  })
})
