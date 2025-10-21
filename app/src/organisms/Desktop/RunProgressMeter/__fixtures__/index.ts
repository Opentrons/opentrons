export const NON_DETERMINISTIC_COMMAND_KEY = 'mockNonDeterministicCommandKey'
export const NON_DETERMINISTIC_COMMAND_ID = 'mock-ND-ID'

export const mockUseAllCommandsResponseNonDeterministic = {
  data: {
    data: [
      {
        id: NON_DETERMINISTIC_COMMAND_ID,
        key: NON_DETERMINISTIC_COMMAND_KEY,
        commandType: 'loadLabware',
        createdAt: '2023-02-22T15:31:23.877610+00:00',
        startedAt: '2023-02-22T15:31:23.877610+00:00',
        completedAt: '2023-02-22T15:31:23.877610+00:00',
        status: 'succeeded',
        params: {
          location: {
            slotName: '1',
          },
          loadName: 'opentrons_96_tiprack_300ul',
          namespace: 'opentrons',
          version: 1,
          displayName: 'Opentrons Tips',
        },
      },
    ],
    meta: {
      cursor: 0,
      totalLength: 42,
    },
  },
} as any

export const mockUseCommandResultNonDeterministic = {
  data: {
    data: {
      id: NON_DETERMINISTIC_COMMAND_ID,
      createdAt: '2023-02-22T15:31:23.891049+00:00',
      commandType: 'loadPipette',
      key: NON_DETERMINISTIC_COMMAND_KEY,
      status: 'succeeded',
      params: {
        pipetteName: 'p300_single',
        mount: 'right',
      },
      result: {
        pipetteId: 'pipette-0',
      },
      startedAt: '2023-02-22T15:31:23.891049+00:00',
      completedAt: '2023-02-22T15:31:23.891049+00:00',
    },
  },
} as any
