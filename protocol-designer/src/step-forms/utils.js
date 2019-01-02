// @flow

// for backwards compatibility, strip version suffix (_v1, _v1.3 etc)
// from model string, if it exists
// TODO Ian 2018-12-13: Remove this and all uses next breaking change in PD files
export const pipetteModelToName = (model: string) =>
  model.replace(/_v\d(\.|\d+)*$/, '')
