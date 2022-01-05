import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import {
  useAllCommandsQuery,
  useCreateCommandMutation,
  useCreateLabwareOffsetMutation,
} from '@opentrons/react-api-client'
import { useLabwarePositionCheck } from '../useLabwarePositionCheck'
import { getConnectedRobotName } from '../../../../../redux/robot/selectors'
import { useCurrentProtocolRun } from '../../../../ProtocolUpload/hooks'
import { getLabwareLocation } from '../../../utils/getLabwareLocation'
import { useSteps } from '../useSteps'

import type { LabwarePositionCheckStep } from '../../types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../redux/robot/selectors')
jest.mock('../../../../../redux/modules')
jest.mock('../../../../ProtocolUpload/hooks')
jest.mock('../../../utils/getLabwareLocation')
jest.mock('../useSteps')

const queryClient = new QueryClient()
const store: Store<any> = createStore(jest.fn(), {})
const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>{' '}
  </Provider>
)

const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockUseSteps = useSteps as jest.MockedFunction<typeof useSteps>
const mockUseCreateCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockUseCreateLabwareOffsetMutation = useCreateLabwareOffsetMutation as jest.MockedFunction<
  typeof useCreateLabwareOffsetMutation
>
const mockGetConnectedRobotName = getConnectedRobotName as jest.MockedFunction<
  typeof getConnectedRobotName
>
const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
describe('useLabwarePositionCheck', () => {
  const MOCK_RUN_ID = 'MOCK_RUN_ID'
  const MOCK_PIPETTE_ID = 'MOCK_PIPETTE_ID'
  const MOCK_LABWARE_ID = 'MOCK_LABWARE_ID'
  const MOCK_SLOT = '1'
  let mockCreateCommand: jest.Mock
  let mockCreateLabwareOffset: jest.Mock
  beforeEach(() => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({ runRecord: { data: { id: MOCK_RUN_ID } } } as any)
    when(mockUseSteps)
      .calledWith()
      .mockReturnValue([
        {
          commands: [
            {
              commandType: 'pickUpTip',
              params: {
                pipetteId: MOCK_PIPETTE_ID,
                labwareId: MOCK_LABWARE_ID,
              },
            },
          ],
          labwareId: MOCK_LABWARE_ID,
          section: 'PRIMARY_PIPETTE_TIPRACKS',
        } as LabwarePositionCheckStep,
      ])
    mockCreateCommand = jest.fn(() =>
      Promise.resolve({ data: { id: 'SOME_ID' } })
    )
    when(mockUseCreateCommandMutation)
      .calledWith()
      .mockReturnValue({ createCommand: mockCreateCommand } as any)
    mockCreateLabwareOffset = jest.fn()
    when(mockUseCreateLabwareOffsetMutation)
      .calledWith()
      .mockReturnValue({ createLabwareOffset: mockCreateLabwareOffset } as any)
    when(mockGetConnectedRobotName)
      .calledWith(expect.anything())
      .mockReturnValue('mock robot!')
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, [])
      .mockReturnValue({ slotName: MOCK_SLOT })
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  describe('jog', () => {
    it('should NOT queue up a new jog command when a previous jog command has NOT completed', async () => {
      when(mockUseAllCommandsQuery)
        .calledWith(MOCK_RUN_ID)
        .mockReturnValue({
          data: { data: [{ commandType: 'moveRelative', status: 'running' }] },
        } as any)

      const { result, waitForNextUpdate } = renderHook(
        () => useLabwarePositionCheck(() => null, {}),
        { wrapper }
      )
      if ('error' in result.current) {
        throw new Error('error should not be present')
      }
      const { beginLPC } = result.current
      beginLPC()
      await waitForNextUpdate()
      const [FIRST_JOG_AXIS, FIRST_JOG_DIRECTION, FIRST_JOG_DISTANCE] = [
        'x' as 'x',
        1 as 1,
        2,
      ]
      const [SECOND_JOG_AXIS, SECOND_JOG_DIRECTION, SECOND_JOG_DISTANCE] = [
        'y' as 'y',
        -1 as -1,
        3,
      ]
      if ('error' in result.current) {
        throw new Error('error should not be present')
      }
      result.current.jog(
        FIRST_JOG_AXIS,
        FIRST_JOG_DIRECTION,
        FIRST_JOG_DISTANCE
      )
      result.current.jog(
        SECOND_JOG_AXIS,
        SECOND_JOG_DIRECTION,
        SECOND_JOG_DISTANCE
      )
      expect(mockCreateCommand).toHaveBeenCalledWith({
        runId: MOCK_RUN_ID,
        command: {
          commandType: 'moveRelative',
          params: {
            pipetteId: 'MOCK_PIPETTE_ID',
            distance: FIRST_JOG_DIRECTION * FIRST_JOG_DISTANCE,
            axis: FIRST_JOG_AXIS,
          },
        },
      })
      expect(mockCreateCommand).not.toHaveBeenCalledWith({
        runId: MOCK_RUN_ID,
        command: {
          commandType: 'moveRelative',
          params: {
            pipetteId: 'MOCK_PIPETTE_ID',
            distance: SECOND_JOG_DIRECTION * SECOND_JOG_DISTANCE,
            axis: SECOND_JOG_AXIS,
          },
        },
      })
    })
    it('should queue up a new jog command when a previous jog command has succeeded', async () => {
      when(mockUseAllCommandsQuery)
        .calledWith(MOCK_RUN_ID)
        .mockReturnValue({
          data: {
            data: [{ commandType: 'moveRelative', status: 'succeeded' }],
          },
        } as any)

      const { result, waitForNextUpdate } = renderHook(
        () => useLabwarePositionCheck(() => null, {}),
        { wrapper }
      )
      if ('error' in result.current) {
        throw new Error('error should not be present')
      }
      const { beginLPC } = result.current
      beginLPC()
      await waitForNextUpdate()
      const [FIRST_JOG_AXIS, FIRST_JOG_DIRECTION, FIRST_JOG_DISTANCE] = [
        'x' as 'x',
        1 as 1,
        2,
      ]
      const [SECOND_JOG_AXIS, SECOND_JOG_DIRECTION, SECOND_JOG_DISTANCE] = [
        'y' as 'y',
        -1 as -1,
        3,
      ]
      if ('error' in result.current) {
        throw new Error('error should not be present')
      }
      result.current.jog(
        FIRST_JOG_AXIS,
        FIRST_JOG_DIRECTION,
        FIRST_JOG_DISTANCE
      )
      result.current.jog(
        SECOND_JOG_AXIS,
        SECOND_JOG_DIRECTION,
        SECOND_JOG_DISTANCE
      )
      expect(mockCreateCommand).toHaveBeenCalledWith({
        runId: MOCK_RUN_ID,
        command: {
          commandType: 'moveRelative',
          params: {
            pipetteId: 'MOCK_PIPETTE_ID',
            distance: FIRST_JOG_DIRECTION * FIRST_JOG_DISTANCE,
            axis: FIRST_JOG_AXIS,
          },
        },
      })
      expect(mockCreateCommand).toHaveBeenCalledWith({
        runId: MOCK_RUN_ID,
        command: {
          commandType: 'moveRelative',
          params: {
            pipetteId: 'MOCK_PIPETTE_ID',
            distance: SECOND_JOG_DIRECTION * SECOND_JOG_DISTANCE,
            axis: SECOND_JOG_AXIS,
          },
        },
      })
    })
  })
})
