import { formatTimestamp } from '../../utils'

import type {
  TipLengthCalibration,
  PipetteOffsetCalibration,
} from '../../../../redux/calibration/api-types'
import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'
import type { TaskListProps } from '../../../TaskList/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

export const TASK_COUNT = 3

export const mockAttachedPipettesResponse: AttachedPipettesByMount = {
  left: {
    id: 'test-left',
    name: 'test-left-name',
    tip_length: 0,
    mount_axis: 'x',
    plunger_axis: 'z',
    model: 'p1000_single_v1',
    modelSpecs: {
      displayName: 'Test Left Display Name',
    } as PipetteModelSpecs,
  },
  right: {
    id: 'test-right',
    name: 'test-right-name',
    tip_length: 0,
    mount_axis: 'x',
    plunger_axis: 'z',
    model: 'p1000_single_v1',
    modelSpecs: {
      displayName: 'Test Right Display Name',
    } as PipetteModelSpecs,
  },
}

export const mockSingleAttachedPipetteResponse: AttachedPipettesByMount = {
  left: {
    id: 'test-left',
    name: 'test-left-name',
    tip_length: 0,
    mount_axis: 'x',
    plunger_axis: 'z',
    model: 'p1000_single_v1',
    modelSpecs: {
      displayName: 'Test Left Display Name',
    } as PipetteModelSpecs,
  },
  right: null,
}

export const mockBadDeckCalibration = {
  deckCalibration: {
    status: 'BAD_CALIBRATION',
    data: {
      lastModified: '2022-01-01T12:00:00.000000+00:00',
      status: { markedBad: true },
    },
  },
}

export const mockCompleteDeckCalibration = {
  deckCalibration: {
    status: 'OK',
    data: {
      lastModified: '2022-01-01T12:00:00.000000+00:00',
      status: { markedBad: false },
    },
  },
}

export const mockIncompleteDeckCalibration = {
  deckCalibration: {
    status: 'IDENTITY',
    data: {
      lastModified: null,
      status: {
        markedBad: false,
      },
    },
  },
}

export const mockBadTipLengthCalibrations: TipLengthCalibration[] = [
  {
    tipLength: 0,
    lastModified: '2022-01-02T12:00:00.000000+00:00',
    tiprack: 'test_tip_rack',
    pipette: 'test-left',
    source: 'user',
    status: { markedBad: true, source: null, markedAt: null },
    id: 'test-tip-length-id-1',
  },
  {
    tipLength: 0,
    lastModified: '2022-01-03T12:00:00.000000+00:00',
    tiprack: 'test_tip_rack',
    pipette: 'test-right',
    source: 'user',
    status: { markedBad: true, source: null, markedAt: null },
    id: 'test-tip-length-id-2',
  },
]

export const mockCompleteTipLengthCalibrations: TipLengthCalibration[] = [
  {
    tipLength: 0,
    lastModified: '2022-01-02T12:00:00.000000+00:00',
    tiprack: 'test_tip_rack',
    pipette: 'test-left',
    source: 'user',
    status: { markedBad: false, source: null, markedAt: null },
    id: 'test-tip-length-id-1',
  },
  {
    tipLength: 0,
    lastModified: '2022-01-03T12:00:00.000000+00:00',
    tiprack: 'test_tip_rack',
    pipette: 'test-right',
    source: 'user',
    status: { markedBad: false, source: null, markedAt: null },
    id: 'test-tip-length-id-2',
  },
]

export const mockIncompleteTipLengthCalibrations: TipLengthCalibration[] = [
  {
    tipLength: 0,
    lastModified: '2022-01-03T12:00:00.000000+00:00',
    tiprack: 'test_tip_rack',
    pipette: 'test-right',
    source: 'user',
    status: { markedBad: false, source: null, markedAt: null },
    id: 'test-tip-length-id-2',
  },
]

export const mockBadPipetteOffsetCalibrations: PipetteOffsetCalibration[] = [
  {
    pipette: 'test-left',
    mount: 'left',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-04T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: true, markedAt: null, source: null },
    id: 'test-offset-id-1',
  },
  {
    pipette: 'test-right',
    mount: 'right',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-05T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: true, markedAt: null, source: null },
    id: 'test-offset-id-2',
  },
]

export const mockCompletePipetteOffsetCalibrations: PipetteOffsetCalibration[] = [
  {
    pipette: 'test-left',
    mount: 'left',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-04T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: false, markedAt: null, source: null },
    id: 'test-offset-id-1',
  },
  {
    pipette: 'test-right',
    mount: 'right',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-05T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: false, markedAt: null, source: null },
    id: 'test-offset-id-2',
  },
]

export const mockIncompletePipetteOffsetCalibrations: PipetteOffsetCalibration[] = [
  {
    pipette: 'test-left',
    mount: 'left',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-04T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: false, markedAt: null, source: null },
    id: 'test-offset-id-1',
  },
  {
    pipette: 'test-right',
    mount: 'right',
    offset: [0, 0, 0],
    tiprack: 'test-tip-rack',
    tiprackUri: 'test/tiprack/uri',
    lastModified: '2022-01-05T12:00:00,000000+00:00',
    source: 'user',
    status: { markedBad: true, markedAt: null, source: null },
    id: 'test-offset-id-2',
  },
]

export const mockDeckCalLauncher = jest.fn()
export const mockTipLengthCalLauncher = jest.fn()
export const mockPipOffsetCalLauncher = jest.fn()

export const expectedTaskList: TaskListProps = {
  activeIndex: null,
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: null,
      description: '',
      title: 'Deck Calibration',
      footer: `Last completed ${formatTimestamp(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockCompleteDeckCalibration.deckCalibration.data.lastModified!
      )}`,
      cta: { label: 'Recalibrate', onClick: mockDeckCalLauncher },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: null,
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: null,
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: null,
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: null,
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: null,
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: null,
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'complete',
}

export const expectedBadDeckTaskList: TaskListProps = {
  activeIndex: [0, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: '',
      title: 'Deck Calibration',
      footer: 'Calibration recommended',
      cta: { label: 'Calibrate', onClick: () => {} },
      markedBad: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedBadDeckAndPipetteOffsetTaskList: TaskListProps = {
  activeIndex: [0, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: '',
      title: 'Deck Calibration',
      footer: 'Calibration recommended',
      cta: { label: 'Calibrate', onClick: () => {} },
      markedBad: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedBadEverythingTaskList: TaskListProps = {
  activeIndex: [0, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: '',
      title: 'Deck Calibration',
      footer: 'Calibration recommended',
      cta: { label: 'Calibrate', onClick: () => {} },
      markedBad: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedBadPipetteOffsetTaskList: TaskListProps = {
  activeIndex: [1, 1],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 1],
      description: '',
      title: 'Deck Calibration',
      footer: 'Calibration recommended',
      cta: { label: 'Calibrate', onClick: () => {} },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 1],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 1],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 1],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 1],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 1],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 1],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedBadTipLengthTaskList: TaskListProps = {
  activeIndex: [1, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: '',
      title: 'Deck Calibration',
      footer: `Last completed ${formatTimestamp(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockCompleteDeckCalibration.deckCalibration.data.lastModified!
      )}`,
      cta: { label: 'Recalibrate', onClick: () => {} },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedBadTipLengthAndOffsetTaskList: TaskListProps = {
  activeIndex: [1, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: '',
      title: 'Deck Calibration',
      footer: `Last completed ${formatTimestamp(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockCompleteDeckCalibration.deckCalibration.data.lastModified!
      )}`,
      cta: { label: 'Recalibrate', onClick: () => {} },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: 'Calibration recommended',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          markedBad: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      markedBad: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'bad',
}

export const expectedIncompleteDeckCalTaskList: TaskListProps = {
  activeIndex: [0, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description:
        'Start with Deck Calibration, which is the basis for the rest of calibration.',
      title: 'Deck Calibration',
      cta: { label: 'Calibrate', onClick: mockDeckCalLauncher },
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'incomplete',
}

export const expectedIncompleteLeftMountTaskList: TaskListProps = {
  activeIndex: [1, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: '',
      title: 'Deck Calibration',
      footer: `Last completed ${formatTimestamp(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockCompleteDeckCalibration.deckCalibration.data.lastModified!
      )}`,
      cta: { label: 'Recalibrate', onClick: mockDeckCalLauncher },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: 'Calibrate the length of a tip on this pipette.',
          title: 'Tip Length Calibration',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description:
            "Calibrate this pipette's offset while attached to the robot's left mount.",
          title: 'Pipette Offset Calibration',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'incomplete',
}

export const expectedIncompleteRightMountTaskList: TaskListProps = {
  activeIndex: [2, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [2, 0],
      description: '',
      title: 'Deck Calibration',
      footer: `Last completed ${formatTimestamp(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockCompleteDeckCalibration.deckCalibration.data.lastModified!
      )}`,
      cta: { label: 'Recalibrate', onClick: mockDeckCalLauncher },
      isComplete: true,
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [2, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [2, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[0].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [2, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [2, 0],
          description: 'Calibrate the length of a tip on this pipette.',
          title: 'Tip Length Calibration',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [2, 0],
          description:
            "Calibrate this pipette's offset while attached to the robot's right mount.",
          title: 'Pipette Offset Calibration',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      taskListLength: TASK_COUNT,
      activeIndex: [2, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'incomplete',
}

export const expectedIncompleteTaskList: TaskListProps = {
  activeIndex: [0, 0],
  taskList: [
    // deck calibration task
    {
      subTasks: [],
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description:
        'Start with Deck Calibration, which is the basis for the rest of calibration.',
      title: 'Deck Calibration',
      cta: { label: 'Calibrate', onClick: mockDeckCalLauncher },
      taskIndex: 0,
    },
    // left mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [1, 0],
          description: 'Calibrate the length of a tip on this pipette.',
          title: 'Tip Length Calibration',
          cta: { label: 'Calibrate', onClick: mockTipLengthCalLauncher },
          taskIndex: 1,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [1, 0],
          description:
            "Calibrate this pipette's offset while attached to the robot's left mount.",
          title: 'Pipette Offset Calibration',
          cta: { label: 'Calibrate', onClick: mockPipOffsetCalLauncher },
          taskIndex: 1,
          subTaskIndex: 1,
        },
      ],
      taskListLength: TASK_COUNT,
      activeIndex: [1, 0],
      description: 'Test Left Display Name, test-left',
      title: 'Left Mount',
      taskIndex: 1,
    },
    // right mount calibration task
    {
      subTasks: [
        // tip length calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Tip Length Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompleteTipLengthCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockTipLengthCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 0,
        },
        // offset calibration subtask
        {
          activeIndex: [0, 0],
          description: '',
          title: 'Pipette Offset Calibration',
          footer: `Last completed ${formatTimestamp(
            mockCompletePipetteOffsetCalibrations[1].lastModified
          )}`,
          cta: { label: 'Recalibrate', onClick: mockPipOffsetCalLauncher },
          isComplete: true,
          taskIndex: 2,
          subTaskIndex: 1,
        },
      ],
      isComplete: true,
      taskListLength: TASK_COUNT,
      activeIndex: [0, 0],
      description: 'Test Right Display Name, test-right',
      title: 'Right Mount',
      taskIndex: 2,
    },
  ],
  taskListStatus: 'incomplete',
}
