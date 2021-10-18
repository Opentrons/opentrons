export interface SavePositionCommand {
  commandType: 'savePosition'
  params: SavePositionParams
}
interface SavePositionParams {
  pipetteId: string // pipette to use in measurement
  positionId?: string // position ID, auto-assigned if left blank
}
