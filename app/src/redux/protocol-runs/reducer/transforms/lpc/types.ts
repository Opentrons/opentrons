import type {
  ClearSelectedLabwareWorkingOffsetsAction,
  FinalPositionAction,
  InitialPositionAction,
  ResetLocationSpecificOffsetToDefaultAction,
} from '/app/redux/protocol-runs'

export type PositionAction = InitialPositionAction | FinalPositionAction

export type ResetPositionAction = ResetLocationSpecificOffsetToDefaultAction

export type UpdateOffsetsAction =
  | PositionAction
  | ResetPositionAction
  | ClearSelectedLabwareWorkingOffsetsAction
