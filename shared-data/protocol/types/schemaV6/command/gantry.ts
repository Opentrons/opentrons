export type GantryCommand =
  | { commandType: 'moveToSlot'; params: MoveToSlotParams }
  | { commandType: 'moveToWell'; params: MoveToWellParams }

interface MoveToSlotParams {
  pipette: string
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
  pipette: string
  labware: string
  well: string
  offset?: {
    x: number
    y: number
    z: number
  }
  minimumZHeight?: number
  forceDirect?: boolean
}
