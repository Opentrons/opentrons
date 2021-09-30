export type GantryCommand =
  | { commandType: 'moveToSlot'; params: MoveToSlotParams }
  | { commandType: 'moveToWell'; params: MoveToWellParams }

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
