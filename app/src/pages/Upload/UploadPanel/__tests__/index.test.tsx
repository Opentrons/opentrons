import * as React from 'react'
import { StaticRouter, Route } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'

import * as ConfigSelectors from '../../../../redux/config/selectors'
import * as RobotSelectors from '../../../../redux/robot/selectors'
import * as ProtocolSelectors from '../../../../redux/protocol/selectors'

import { UploadPanel } from '../'

import type { State, Action } from '../../../../redux/types'

jest.mock('../../../../redux/config/selectors')
jest.mock('../../../../redux/robot/selectors')
jest.mock('../../../../redux/protocol/selectors')

const getFeatureFlags = ConfigSelectors.getFeatureFlags as jest.MockedFunction<
  typeof ConfigSelectors.getFeatureFlags
>
const getProtocolFilename = ProtocolSelectors.getProtocolFilename as jest.MockedFunction<
  typeof ProtocolSelectors.getProtocolFilename
>
const getSessionIsLoaded = RobotSelectors.getSessionIsLoaded as jest.MockedFunction<
  typeof RobotSelectors.getSessionIsLoaded
>

describe('Upload Panel', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof UploadPanel>,
      State,
      Action
    >(
      <StaticRouter location="/upload/file-info" context={{}}>
        <Route path="/upload">
          <UploadPanel />
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

    getSessionIsLoaded.mockReturnValue(false)
    getProtocolFilename.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders legacy RPC upload panel if feature flag not set', () => {
    const { wrapper } = render()
    expect(wrapper.find('SidePanel').exists()).toBe(true)
  })

  it('renders http upload page if feature flag is set', () => {
    getFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
      preProtocolFlowWithoutRPC: true,
    })
    const { wrapper } = render()
    expect(wrapper.find('SidePanel').exists()).toBe(false)
  })
})
