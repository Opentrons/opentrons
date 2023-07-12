// TODO(va, 08/10/22): almost this entire branch of the redux store is now deprecated and
// the react-api-client's useModulesQuery should be used instead
// we need to add useUpdateModuleMutation to replace updateModule and most of this directory can be removed
// when deleting directory we should move fixtures and types somewhere, possible opentrons/api-client
// where lots of other types/fixtures live
// THIS IS DEPRECATED AND SLATED FOR IMMEDIATE REMOVAL

export * from './actions'
export * from './constants'
