import type { CommonCommandInfo } from '.'
import type { MotorAxis } from '../../../../js/types'
export interface MoveToSlotCommand extends CommonCommandInfo {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
  result?: {}
}
export interface MoveToWellCommand extends CommonCommandInfo {
  commandType: 'moveToWell'
  params: MoveToWellParams
  result?: {}
}
export interface MoveToCoordinatesCommand extends CommonCommandInfo {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
  result?: {}
}
export interface MoveRelativeCommand extends CommonCommandInfo {
  commandType: 'moveRelative'
  params: MoveRelativeParams
  result?: {}
}
export interface SavePositionCommand extends CommonCommandInfo {
  commandType: 'savePosition'
  params: SavePositionParams
  result?: {}
}
export interface HomeCommand extends CommonCommandInfo {
  commandType: 'home'
  params: HomeParams
  result?: {}
}
export type GantryCommand =
  | MoveToSlotCommand
  | MoveToWellCommand
  | MoveToCoordinatesCommand
  | MoveRelativeCommand
  | SavePositionCommand
  | HomeCommand

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

interface HomeParams {
  axes?: MotorAxis
}
