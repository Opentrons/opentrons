import type { CommonCommandRunTimeInfo } from '.'
import type { MotorAxis } from '../../../../js/types'

export interface MoveToSlotCreateCommand {
  commandType: 'moveToSlot'
  params: MoveToSlotParams
}
export interface MoveToSlotRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToSlotCreateCommand {
  result: {}
}
export interface MoveToWellCreateCommand {
  commandType: 'moveToWell'
  params: MoveToWellParams
}
export interface MoveToWellRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToWellCreateCommand {
  result: {}
}
export interface MoveToCoordinatesCreateCommand {
  commandType: 'moveToCoordinates'
  params: MoveToCoordinatesParams
}
export interface MoveToCoordinatesRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToCoordinatesCreateCommand {
  result: {}
}
export interface MoveRelativeCreateCommand {
  commandType: 'moveRelative'
  params: MoveRelativeParams
}
export interface MoveRelativeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveRelativeCreateCommand {
  result: {}
}
export interface SavePositionCreateCommand {
  commandType: 'savePosition'
  params: SavePositionParams
}
export interface SavePositionRunTimeCommand
  extends CommonCommandRunTimeInfo,
    SavePositionCreateCommand {
  result: {}
}
export interface HomeCreateCommand {
  commandType: 'home'
  params: HomeParams
}
export interface HomeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HomeCreateCommand {
  result: {}
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
