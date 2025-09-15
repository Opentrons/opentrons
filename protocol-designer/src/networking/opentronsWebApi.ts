export const getIsProduction = (): boolean =>
  globalThis.location.host === 'designer.opentrons.com'
