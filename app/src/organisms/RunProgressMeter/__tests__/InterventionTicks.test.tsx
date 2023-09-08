import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { InterventionTicks } from '../InterventionTicks'
import { Tick } from '../Tick'

jest.mock('../Tick')

const mockTick = Tick as jest.MockedFunction<typeof Tick>

const render = (props: React.ComponentProps<typeof InterventionTicks>) => {
  return renderWithProviders(<InterventionTicks {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionTicks', () => {
  let props: React.ComponentProps<typeof InterventionTicks>
  beforeEach(() => {
    mockTick.mockImplementation(({ index }) => (
      <div>MOCK TICK at index: {index}</div>
    ))
    props = {
      analysisCommands: [],
      makeHandleJumpToStep: jest.fn(),
    }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should show one tick for waitForResume command', () => {
    const { getByText } = render({
      ...props,
      analysisCommands: [
        {
          id: 'fake_id1',
          key: 'fake_key1',
          commandType: 'home',
          createdAt: '2023-02-22T15:31:23.877610+00:00',
          startedAt: '2023-02-22T15:31:23.877610+00:00',
          completedAt: '2023-02-22T15:31:23.877610+00:00',
          status: 'succeeded',
          params: {},
        },
        {
          id: 'fake_id2',
          key: 'fake_key2',
          commandType: 'waitForResume',
          createdAt: '2023-02-22T15:31:23.877610+00:00',
          startedAt: '2023-02-22T15:31:23.877610+00:00',
          completedAt: '2023-02-22T15:31:23.877610+00:00',
          status: 'succeeded',
          params: {},
        },
      ],
    })
    expect(getByText('MOCK TICK at index: 1')).toBeTruthy()
  })
  it('should show tick only for moveLabware commands if strategy is moveManualWithPause', () => {
    const { getByText } = render({
      ...props,
      analysisCommands: [
        {
          id: 'fake_id1',
          key: 'fake_key1',
          commandType: 'moveLabware',
          createdAt: '2023-02-22T15:31:23.877610+00:00',
          startedAt: '2023-02-22T15:31:23.877610+00:00',
          completedAt: '2023-02-22T15:31:23.877610+00:00',
          status: 'succeeded',
          params: {
            labwareId: 'fake_labware_id',
            strategy: 'usingGripper',
            newLocation: { slotName: 'A1' },
          },
        },
        {
          id: 'fake_id2',
          key: 'fake_key2',
          commandType: 'moveLabware',
          createdAt: '2023-02-22T15:31:23.877610+00:00',
          startedAt: '2023-02-22T15:31:23.877610+00:00',
          completedAt: '2023-02-22T15:31:23.877610+00:00',
          status: 'succeeded',
          params: {
            labwareId: 'fake_labware_id',
            strategy: 'manualMoveWithoutPause',
            newLocation: { slotName: 'A2' },
          },
        },
        {
          id: 'fake_id3',
          key: 'fake_key3',
          commandType: 'moveLabware',
          createdAt: '2023-02-22T15:31:23.877610+00:00',
          startedAt: '2023-02-22T15:31:23.877610+00:00',
          completedAt: '2023-02-22T15:31:23.877610+00:00',
          status: 'succeeded',
          params: {
            labwareId: 'fake_labware_id',
            strategy: 'manualMoveWithPause',
            newLocation: { slotName: 'A3' },
          },
        },
      ],
    })
    expect(getByText('MOCK TICK at index: 2')).toBeTruthy()
  })
})
