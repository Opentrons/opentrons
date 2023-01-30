import { Mount } from '../pipettes'

export interface PipOffsetDeletionParams {
  calType: 'pipetteOffset'
  pipette_id: string
  mount: Mount
}

export interface TipLengthDeletionParams {
  calType: 'tipLength'
  tiprack_hash: string
  pipette_id: string
}
export type DeleteCalRequestParams =
  | PipOffsetDeletionParams
  | TipLengthDeletionParams
