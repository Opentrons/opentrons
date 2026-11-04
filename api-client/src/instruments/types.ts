import type { PipetteChannels, PipetteModel } from '@opentrons/shared-data'

export type InstrumentData = PipetteData | GripperData | BadPipette | BadGripper

export type Mount = 'left' | 'right'
export type InstrumentMount = Mount | 'extension'

export const INCONSISTENT_PIPETTE_OFFSET = 'inconsistent-pipette-offset'

export interface InconsistentCalibrationFailure {
  kind: 'inconsistent-pipette-offset'
  offsets: Map<Mount, { x: number; y: number; z: number }>
  limit: number
}

export type CalibrationReasonabilityCheckFailure =
  InconsistentCalibrationFailure

export interface SharedInstrumentData {
  mount: InstrumentMount
}
export interface GripperData {
  data: {
    jawState: string
    calibratedOffset?: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified?: string
      reasonability_check_failures?: null[]
    }
  }
  firmwareVersion?: string
  instrumentModel: string
  displayName?: string
  instrumentType: 'gripper'
  mount: 'extension'
  serialNumber: string
  subsystem: 'gripper'
  ok: true
}
export interface PipetteData {
  data: {
    channels: PipetteChannels
    min_volume: number
    max_volume: number
    calibratedOffset?: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified?: string
      reasonability_check_failures?: CalibrationReasonabilityCheckFailure[]
    }
  }
  firmwareVersion?: string
  instrumentName: string
  instrumentModel: PipetteModel
  displayName?: string
  instrumentType: 'pipette'
  mount: Mount
  serialNumber: string
  state?: {
    tipDetected: boolean
  }
  subsystem: 'pipette_left' | 'pipette_right'
  ok: true
}

export type InstrumentsData = InstrumentData[]

export interface InstrumentsMeta {
  cursor: number
  totalLength: number
}

export interface Instruments {
  data: InstrumentsData
  meta: InstrumentsMeta
}

export interface GetInstrumentsRequestParams {
  refresh?: boolean
}

export interface BadPipette {
  subsystem: 'pipette_left' | 'pipette_right'
  status: string
  update: string
  ok: false
  instrumentType: 'pipette'
}

export interface BadGripper {
  subsystem: 'gripper'
  status: string
  update: string
  ok: false
  instrumentType: 'gripper'
}
