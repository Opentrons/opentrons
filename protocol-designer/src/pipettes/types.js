// @flow

export type PipetteReducerState = {
  byMount: {|
    left: ?string,
    right: ?string,
  |},
  byId: {
    [pipetteId: string]: PipetteData,
  },
}
