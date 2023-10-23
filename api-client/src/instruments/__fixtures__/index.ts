export const instrumentsResponseFixture = {
  data: [
    {
      data: {
        jawState: 'unhomed',
        calibratedOffset: {
          last_modified: '2023-01-13T20:39:13.401019+00:00',
          offset: [
            0.07500000000001705,
            0.45000000000015916,
            0.07499999999988916,
          ],
          source: 'user',
          status: { markedBad: false, source: null, markedAt: null },
        },
      },
      instrumentModel: 'gripperV1',
      instrumentType: 'gripper',
      mount: 'extension',
      serialNumber: 'GRPV0.120221115A01',
      meta: {
        cursor: 0,
        totalLength: 1,
      },
      ok: true,
      subsystem: 'gripper',
    },
  ],
}

export const instrumentsResponseLeftPipetteFixture = {
  data: { channels: 1, min_volume: 1, max_volume: 50 },
  instrumentModel: 'p1000_single_v3.0',
  instrumentName: 'p1000_single_flex',
  instrumentType: 'pipette',
  mount: 'left',
  serialNumber: 'abc',
  subsystem: 'pipette_left',
  ok: true,
}

export const instrumentsResponseRightPipetteFixture = {
  data: { channels: 1, min_volume: 1, max_volume: 50 },
  instrumentModel: 'p1000_single_v3.0',
  instrumentName: 'p1000_single_flex',
  instrumentType: 'pipette',
  mount: 'right',
  serialNumber: 'cba',
  subsystem: 'pipette_right',
  ok: true,
}
