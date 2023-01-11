import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import * as Buildroot from '../../../redux/buildroot'
import { mockConnectableRobot as mockRobot } from '../../../redux/discovery/__fixtures__'
import { CheckUpdates } from '../../../organisms/UpdateRobotSoftware/CheckUpdates'
import { CompleteUpdateSoftware } from '../../../organisms/UpdateRobotSoftware/CompleteUpdateSoftware'
import { ErrorUpdateSoftware } from '../../../organisms/UpdateRobotSoftware/ErrorUpdateSoftware'
import { NoUpdateFound } from '../../../organisms/UpdateRobotSoftware/NoUpdateFound'
import { UpdateSoftware } from '../../../organisms/UpdateRobotSoftware/UpdateSoftware'

import { UpdateRobot } from '../UpdateRobot'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/buildroot')
jest.mock('../../../organisms/UpdateRobotSoftware/CheckUpdates')
jest.mock('../../../organisms/UpdateRobotSoftware/CompleteUpdateSoftware')
jest.mock('../../../organisms/UpdateRobotSoftware/ErrorUpdateSoftware')
jest.mock('../../../organisms/UpdateRobotSoftware/NoUpdateFound')
jest.mock('../../../organisms/UpdateRobotSoftware/UpdateSoftware')

const mockCheckUpdates = CheckUpdates as jest.MockedFunction<
  typeof CheckUpdates
>
const mockCompleteUpdateSoftware = CompleteUpdateSoftware as jest.MockedFunction<
  typeof CompleteUpdateSoftware
>
const mockErrorUpdateSoftware = ErrorUpdateSoftware as jest.MockedFunction<
  typeof ErrorUpdateSoftware
>
const mockNoUpdateFound = NoUpdateFound as jest.MockedFunction<
  typeof NoUpdateFound
>
const mockUpdateSoftware = UpdateSoftware as jest.MockedFunction<
  typeof UpdateSoftware
>
const mockGetBuildrootUpdateAvailable = Buildroot.getBuildrootUpdateAvailable as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateAvailable
>
const mockGetBuildrootSession = Buildroot.getBuildrootSession as jest.MockedFunction<
  typeof Buildroot.getBuildrootSession
>

const mockSession = {
  robotName: mockRobot.name,
  userFileInfo: null,
  token: null,
  pathPrefix: null,
  step: null,
  stage: null,
  progress: null,
  error: null,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UpdateRobot />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('UpdateRobot', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockGetBuildrootUpdateAvailable.mockReturnValue(Buildroot.UPGRADE)
    mockCheckUpdates.mockReturnValue(<div>mock CheckUpdates</div>)
    mockCompleteUpdateSoftware.mockReturnValue(
      <div>mock CompleteUpdateSoftware</div>
    )
    mockErrorUpdateSoftware.mockReturnValue(<div>mock ErrorUpdateSoftware</div>)
    mockNoUpdateFound.mockReturnValue(<div>mock NoUpdateFound</div>)
    mockUpdateSoftware.mockReturnValue(<div>mock UpdateSoftware</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render mock CheckUpdates', () => {
    const [{ getByText }] = render()
    getByText('mock CheckUpdates')
  })

  it('mock CheckUpdates should disappear after 10 sec', () => {
    const [{ getByText }] = render()
    const checkUpdates = getByText('mock CheckUpdates')
    jest.advanceTimersByTime(1000)
    expect(checkUpdates).toBeInTheDocument()
    jest.advanceTimersByTime(11000)
    expect(checkUpdates).not.toBeInTheDocument()
  })

  it('should render mock Update Software for downloading', () => {
    const mockDownloadSession = {
      ...mockSession,
      step: Buildroot.PREMIGRATION,
    }
    mockGetBuildrootSession.mockReturnValue(mockDownloadSession)
    const [{ getByText }] = render()
    jest.advanceTimersByTime(11000)
    getByText('mock UpdateSoftware')
  })

  // it('should render mock Update Software for sending file', () => {
  //   const mockSendingFileSession = {
  //     ...mockSession,
  //   }
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock UpdateSoftware')
  // })

  // it('should render mock Update Software for validating', () => {
  //   const mockValidatingSession = {
  //     ...mockSession,
  //   }
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock UpdateSoftware')
  // })

  // it('should render mock Update Software for installing', () => {
  //   const mockInstallingSession = {
  //     ...mockSession,
  //   }
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock UpdateSoftware')
  // })

  // it('should render mock NoUpdate found when there is no upgrade - reinstall', () => {
  //   mockGetBuildrootUpdateAvailable.mockReturnValue(Buildroot.REINSTALL)
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock NoUpdateFound')
  // })

  // it('should render mock NoUpdate found when there is no upgrade - downgrade', () => {
  //   mockGetBuildrootUpdateAvailable.mockReturnValue(Buildroot.DOWNGRADE)
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock NoUpdateFound')
  // })

  // it('should render mock CompleteUpdateSoftware when the step is finished', () => {
  //   const mockCompleteSession = {
  //     ...mockSession,
  //     step: Buildroot.FINISHED,
  //   }
  //   mockGetBuildrootSession.mockReturnValue(mockCompleteSession)
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock CompleteUpdateSoftware')
  // })

  // it('should render mock ErrorUpdateSoftware when an error occurs', () => {
  //   const mockErrorSession = {
  //     ...session,
  //     error:
  //   }
  //   const [{ getByText }] = render()
  //   jest.advanceTimersByTime(11000)
  //   getByText('mock ErrorUpdateSoftware')
  // })
})
