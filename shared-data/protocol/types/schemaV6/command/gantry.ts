export type GantryCommand =
  | { commandType: 'moveToSlot'; params: MoveToSlotParams; result?: {} }
  | { commandType: 'moveToWell'; params: MoveToWellParams; result?: {} }
  | {
      commandType: 'moveToCoordinates'
      params: MoveToCoordinatesParams
      result?: {}
    }
  | { commandType: 'moveRelative'; params: MoveRelativeParams; result?: {} }
  | { commandType: 'savePosition'; params: SavePositionParams; result?: {} }

interface MoveToSlotParams {
  pipetteId: string
  slotName: string
  offset?: {
    x: number
    y: number
    z: number
  }
  minimumZHeight?: number
  forceDirect?: boolean
}

interface MoveToWellParams {
  pipetteId: string
  labwareId: string
  wellName: string
  wellLocation: {
    origin: 'top' | 'bottom'
    offset?: {
      x: number
      y: number
      z: number
    }
  }
  minimumZHeight?: number
  forceDirect?: boolean
}

interface MoveToCoordinatesParams {
  pipetteId: string
  coordinates: {
    x: number
    y: number
    z: number
  }
  minimumZHeight?: number
  forceDirect?: boolean
}

interface MoveRelativeParams {
  pipetteId: string
  axis: 'x' | 'y' | 'z'
  distance: number
}

interface SavePositionParams {
  pipetteId: string // pipette to use in measurement
  positionId?: string // position ID, auto-assigned if left blank
}
