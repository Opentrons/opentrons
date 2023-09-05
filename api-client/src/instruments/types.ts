export type InstrumentData = PipetteData | GripperData | BadPipette | BadGripper

// pipettes module already exports type `Mount`
type Mount = 'left' | 'right' | 'extension'

export interface SharedInstrumentData {
  mount: Mount
}
export interface GripperData {
  data: {
    jawState: string
    calibratedOffset?: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified?: string
    }
  }
  firmwareVersion?: string
  instrumentModel: string
  instrumentType: 'gripper'
  mount: 'extension'
  serialNumber: string
  subsystem: 'gripper'
  ok: true
}
export interface PipetteData {
  data: {
    channels: number
    min_volume: number
    max_volume: number
    calibratedOffset?: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified?: string
    }
  }
  firmwareVersion?: string
  instrumentName: string
  instrumentModel: string
  instrumentType: 'pipette'
  mount: 'left' | 'right'
  serialNumber: string
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
