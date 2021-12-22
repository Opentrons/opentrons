import type { CommonCommandInfo } from '.'
import type { MotorAxis } from '../../../../js/types'

export interface MoveToSlotCreateCommand extends CommonCommandInfo {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
  result?: {}
}
export interface MoveToSlotCommand extends MoveToSlotCreateCommand {
  key: string
}
export interface MoveToWellCreateCommand extends CommonCommandInfo {
  commandType: 'moveToWell'
  params: MoveToWellParams
  result?: {}
}
export interface MoveToWellCommand extends MoveToWellCreateCommand {
  key: string
}
export interface MoveToCoordinatesCreateCommand extends CommonCommandInfo {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
  result?: {}
}
export interface MoveToCoordinatesCommand
  extends MoveToCoordinatesCreateCommand {
  key: string
}
export interface MoveRelativeCreateCommand extends CommonCommandInfo {
  commandType: 'moveRelative'
  params: MoveRelativeParams
  result?: {}
}
export interface MoveRelativeCommand extends MoveRelativeCreateCommand {
  key: string
}
export interface SavePositionCreateCommand extends CommonCommandInfo {
  commandType: 'savePosition'
  params: SavePositionParams
  result?: {}
}
export interface SavePositionCommand extends SavePositionCreateCommand {
  key: string
}
export interface HomeCreateCommand extends CommonCommandInfo {
  commandType: 'home'
  params: HomeParams
  result?: {}
}
export interface HomeCommand extends HomeCreateCommand {
  key: string
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
