import type { CommonCommandInfo, CommonCreateCommandInfo } from '.'
import type { MotorAxis } from '../../../../js/types'
export interface MoveToSlotCommand extends CommonCommandInfo {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
  result?: {}
}
export interface MoveToSlotCreateCommand extends CommonCreateCommandInfo {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
  result?: {}
}
export interface MoveToWellCommand extends CommonCommandInfo {
  commandType: 'moveToWell'
  params: MoveToWellParams
  result?: {}
}
export interface MoveToWellCreateCommand extends CommonCreateCommandInfo {
  commandType: 'moveToWell'
  params: MoveToWellParams
  result?: {}
}
export interface MoveToCoordinatesCommand extends CommonCommandInfo {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
  result?: {}
}
export interface MoveToCoordinatesCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
  result?: {}
}
export interface MoveRelativeCommand extends CommonCommandInfo {
  commandType: 'moveRelative'
  params: MoveRelativeParams
  result?: {}
}
export interface MoveRelativeCreateCommand extends CommonCreateCommandInfo {
  commandType: 'moveRelative'
  params: MoveRelativeParams
  result?: {}
}
export interface SavePositionCommand extends CommonCommandInfo {
  commandType: 'savePosition'
  params: SavePositionParams
  result?: {}
}
export interface SavePositionCreateCommand extends CommonCreateCommandInfo {
  commandType: 'savePosition'
  params: SavePositionParams
  result?: {}
}
export interface HomeCommand extends CommonCommandInfo {
  commandType: 'home'
  params: HomeParams
  result?: {}
}
export interface HomeCreateCommand extends CommonCreateCommandInfo {
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
export type GantryCreateCommand =
  | MoveToSlotCreateCommand
  | MoveToWellCreateCommand
  | MoveToCoordinatesCreateCommand
  | MoveRelativeCreateCommand
  | SavePositionCreateCommand
  | HomeCreateCommand

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
