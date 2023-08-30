export type Subsystem =
  | 'gantry_x'
  | 'gantry_y'
  | 'head'
  | 'pipette_left'
  | 'pipette_right'
  | 'gripper'
  | 'rear_panel'

type UpdateStatus = 'queued' | 'updating' | 'done'
export interface SubsystemUpdateProgressData {
  data: {
    id: string
    createdAt: string
    subsystem: Subsystem
    updateStatus: UpdateStatus
    updateProgress: number
    updateError: string
  }
}

export interface CurrentSubsystemUpdate {
  id: string
  createdAt: string
  subsystem: Subsystem
  updateStatus: UpdateStatus
}

export interface CurrentSubsystemUpdates {
  data: CurrentSubsystemUpdate[]
}
