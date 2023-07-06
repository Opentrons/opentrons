export type Subsystem =
  | 'gantry_x'
  | 'gantry_y'
  | 'head'
  | 'pipette_left'
  | 'pipette_right'
  | 'gripper'
  | 'rear_panel'

export interface SubsystemUpdateProgressData {
  data: {
    id: string
    createdAt: string
    subsystem: Subsystem
    updateStatus: 'queued' | 'updating' | 'done'
    updateProgress: number
    updateError: string
  }
}
