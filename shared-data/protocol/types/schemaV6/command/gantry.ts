export type GantryCommand =
  | { commandType: 'moveToSlot'; params: MoveToSlotParams }
  | { commandType: 'moveToWell'; params: MoveToWellParams }
  | { commandType: 'moveToCoordinates'; params: MoveToCoordinatesParams }
  | { commandType: 'moveRelative'; params: MoveRelativeParams }

interface MoveToSlotParams {
  pipetteId: string
  slot: string
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
  offset?: {
    x: number
    y: number
    z: number
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
