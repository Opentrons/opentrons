// common types

export type Instruments = FetchInstrumentsResponseBody

// API response types

export interface InstrumentData {
  data: {
    jawState: string,
    calibratedOffset: {
      last_modified: string,
      offset: [0.07500000000001705, 0.45000000000015916, 0.07499999999988916],
      source: "user",
      status: { markedBad: false, source: null, markedAt: null }
    }
  },
  instrumentModel: string
  instrumentType: string,
  mount: string,
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
