export type InstrumentData = PipetteData | GripperData

export interface GripperData {
  data: {
    jawState: string
    calibratedOffset: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified: string
    }
  }
  instrumentModel: string
  instrumentType: 'gripper'
  mount: string
  serialNumber: string
}
export interface PipetteData {
  data: {
    channels: number
    min_volume: number
    max_volume: number
    calibratedOffset: {
      offset: { x: number; y: number; z: number }
      source: string
      last_modified: string
    }
  }
  instrumentName: string
  instrumentModel: string
  instrumentType: 'pipette'
  mount: string
  serialNumber: string
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
