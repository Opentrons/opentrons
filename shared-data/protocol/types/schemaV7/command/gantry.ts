import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { Coordinates, MotorAxes } from '../../../../js/types'

export interface MoveToSlotCreateCommand extends CommonCommandCreateInfo {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
}
export interface MoveToSlotRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToSlotCreateCommand {
  result?: {}
}
export interface MoveToWellCreateCommand extends CommonCommandCreateInfo {
  commandType: 'moveToWell'
  params: MoveToWellParams
}
export interface MoveToWellRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToWellCreateCommand {
  result?: {}
}
export interface MoveToCoordinatesCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
}
export interface MoveToCoordinatesRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToCoordinatesCreateCommand {
  result?: {}
}
export interface MoveRelativeCreateCommand extends CommonCommandCreateInfo {
  commandType: 'moveRelative'
  params: MoveRelativeParams
}
export interface MoveRelativeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveRelativeCreateCommand {
  result?: {
    position: Coordinates
  }
}
export interface SavePositionCreateCommand extends CommonCommandCreateInfo {
  commandType: 'savePosition'
  params: SavePositionParams
}
export interface SavePositionRunTimeCommand
  extends CommonCommandRunTimeInfo,
    SavePositionCreateCommand {
  result?: {
    positionId: string
    position: Coordinates
  }
}
export interface HomeCreateCommand extends CommonCommandCreateInfo {
  commandType: 'home'
  params: HomeParams
}
export interface HomeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HomeCreateCommand {
  result?: {}
}
export type GantryRunTimeCommand =
  | MoveToSlotRunTimeCommand
  | MoveToWellRunTimeCommand
  | MoveToCoordinatesRunTimeCommand
  | MoveRelativeRunTimeCommand
  | SavePositionRunTimeCommand
  | HomeRunTimeCommand
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

export interface MoveToWellParams {
  pipetteId: string
  labwareId: string
  wellName: string
  wellLocation?: {
    origin?: 'top' | 'bottom'
    offset?: {
      x?: number
      y?: number
      z?: number
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
  axes?: MotorAxes
}
