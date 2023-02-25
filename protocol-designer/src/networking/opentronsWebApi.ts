export const getIsProduction = (): boolean =>
  global.location.host === 'designer.opentrons.com'
