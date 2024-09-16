import type {
  CutoutFixtureId,
  CutoutId,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'

export interface ProtocolPipette {
  hardwareType: 'pipette'
  pipetteName: PipetteName
  mount: 'left' | 'right'
  connected: boolean
}

export interface ProtocolModule {
  hardwareType: 'module'
  moduleModel: ModuleModel
  slot: string
  connected: boolean
  hasSlotConflict: boolean
}

export interface ProtocolGripper {
  hardwareType: 'gripper'
  connected: boolean
}

export interface ProtocolFixture {
  hardwareType: 'fixture'
  cutoutFixtureId: CutoutFixtureId | null
  location: { cutout: CutoutId }
  hasSlotConflict: boolean
}

export type ProtocolHardware =
  | ProtocolPipette
  | ProtocolModule
  | ProtocolGripper
  | ProtocolFixture
