import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { getRobotName } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useRobotName } from '..'

import type {
  HostConfig,
  Response,
  CurrentRobotName,
} from '@opentrons/api-client'
import { act } from 'react-test-renderer'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetRobotName = getRobotName as jest.MockedFunction<
  typeof getRobotName
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

const ROBOT_NAME = { name: 'otie' }

describe('useRobotName hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useRobotName, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getRobotName request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetRobotName).calledWith(HOST_CONFIG).mockRejectedValue('fail')

    const { result } = renderHook(useRobotName, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return robot name', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetRobotName)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: ROBOT_NAME,
      } as Response<CurrentRobotName>)

    const { result, waitFor } = renderHook(useRobotName, { wrapper })
    await waitFor(() => result.current.data != null)
    expect(result.current.data).toEqual(ROBOT_NAME)
  })
})
