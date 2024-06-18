import { describe, expect, it } from 'vitest'

import { getFailedCommandPipetteInfo } from '../getFailedCommandPipetteInfo'

describe('getFailedCommandPipetteInfo', () => {
  const failedCommand = {
    params: {
      pipetteId: 'pipetteId1',
    },
  } as any

  const runRecordPipette1 = {
    id: 'pipetteId1',
    mount: 'left',
  } as any

  const runRecordPipette2 = {
    id: 'pipetteId2',
    mount: 'right',
  } as any

  const attachedInstrument1 = {
    mount: 'left',
    name: 'Pipette 1',
  } as any

  const attachedInstrument2 = {
    mount: 'right',
    name: 'Pipette 2',
  } as any

  it('should return null if failedCommand is null', () => {
    const result = getFailedCommandPipetteInfo({
      failedCommand: null,
      runRecord: undefined,
      attachedInstruments: undefined,
    })
    expect(result).toBeNull()
  })

  it('should return null if failedCommand does not have pipetteId in params', () => {
    const result = getFailedCommandPipetteInfo({
      failedCommand: { params: {} } as any,
      runRecord: undefined,
      attachedInstruments: undefined,
    })
    expect(result).toBeNull()
  })

  it('should return null if no matching pipette is found in runRecord', () => {
    const result = getFailedCommandPipetteInfo({
      failedCommand,
      runRecord: { data: { pipettes: [runRecordPipette2] } } as any,
      attachedInstruments: {
        data: [attachedInstrument1, attachedInstrument2],
      } as any,
    })
    expect(result).toBeNull()
  })

  it('should return null if no matching instrument is found in attachedInstruments', () => {
    const result = getFailedCommandPipetteInfo({
      failedCommand,
      runRecord: { data: { pipettes: [runRecordPipette1] } } as any,
      attachedInstruments: { data: [attachedInstrument2] } as any,
    })
    expect(result).toBeNull()
  })

  it('should return the matching pipette data', () => {
    const result = getFailedCommandPipetteInfo({
      failedCommand,
      runRecord: {
        data: { pipettes: [runRecordPipette1, runRecordPipette2] },
      } as any,
      attachedInstruments: {
        data: [attachedInstrument1, attachedInstrument2],
      } as any,
    })
    expect(result).toEqual(attachedInstrument1)
  })
})
