export interface InstrumentData {
  data: {
    jawState: string
    calibratedOffset: {
      last_modified: string
      offset: [number, number, number]
      source: string
      status: {
        markedBad: boolean
        source: string | null
        markedAt: string | null
      }
    }
  }
  instrumentModel: string
  instrumentType: string
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
