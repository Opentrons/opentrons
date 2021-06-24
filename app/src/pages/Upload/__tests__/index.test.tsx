import * as React from 'react'
import { StaticRouter, Route } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'

import * as Fixtures from '../../../redux/discovery/__fixtures__'
import * as ConfigSelectors from '../../../redux/config/selectors'
import * as RobotSelectors from '../../../redux/robot/selectors'
import * as ProtocolSelectors from '../../../redux/protocol/selectors'
import * as DiscoSelectors from '../../../redux/discovery/selectors'
import * as CustomLWSelectors from '../../../redux/custom-labware/selectors'

import { Upload } from '../'

import type { State, Action } from '../../../redux/types'

jest.mock('../../../redux/config/selectors')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/custom-labware/selectors')

const getFeatureFlags = ConfigSelectors.getFeatureFlags as jest.MockedFunction<
  typeof ConfigSelectors.getFeatureFlags
>
const getSessionLoadInProgress = RobotSelectors.getSessionLoadInProgress as jest.MockedFunction<
  typeof RobotSelectors.getSessionLoadInProgress
>
const getUploadError = RobotSelectors.getUploadError as jest.MockedFunction<
  typeof RobotSelectors.getUploadError
>
const getSessionIsLoaded = RobotSelectors.getSessionIsLoaded as jest.MockedFunction<
  typeof RobotSelectors.getSessionIsLoaded
>
const getCommands = RobotSelectors.getCommands as jest.MockedFunction<
  typeof RobotSelectors.getCommands
>
const getProtocolFilename = ProtocolSelectors.getProtocolFilename as jest.MockedFunction<
  typeof ProtocolSelectors.getProtocolFilename
>
const getCustomLabware = CustomLWSelectors.getCustomLabware as jest.MockedFunction<
  typeof CustomLWSelectors.getCustomLabware
>
const getConnectedRobot = DiscoSelectors.getConnectedRobot as jest.MockedFunction<
  typeof DiscoSelectors.getConnectedRobot
>

describe('Upload page', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof Upload>,
      State,
      Action
    >(
      <StaticRouter location="/upload/file-info" context={{}}>
        <Route path="/upload">
          <Upload />
        </Route>
      </StaticRouter>,
      { i18n }
    )
  }

  beforeEach(() => {
    jest.useFakeTimers()
    getFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
      preProtocolFlowWithoutRPC: false,
    })

    getSessionLoadInProgress.mockReturnValue(false)
    getUploadError.mockReturnValue(null)
    getSessionIsLoaded.mockReturnValue(false)
    getCommands.mockReturnValue([])
    getProtocolFilename.mockReturnValue(null)
    getCustomLabware.mockReturnValue([])
    getConnectedRobot.mockReturnValue(Fixtures.mockConnectedRobot)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders legacy RPC upload page if feature flag not set', () => {
    const { wrapper } = render()
    expect(wrapper.find('FileInfo').exists()).toBe(true)
    expect(wrapper.find('ProtocolUpload').exists()).toBe(false)
  })

  it('renders http upload page if feature flag is set', () => {
    getFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
      preProtocolFlowWithoutRPC: true,
    })
    const { wrapper } = render()
    expect(wrapper.find('FileInfo').exists()).toBe(false)
    expect(wrapper.find('ProtocolUpload').exists()).toBe(true)
  })
})
