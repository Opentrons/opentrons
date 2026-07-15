const PRODUCTION_HOST = 'ot2.designer.opentrons.com'
const STAGING_HOST = 'ot2.staging.designer.opentrons.com'

const getHost = (): string => global.location.host

export const getIsProduction = (): boolean => getHost() === PRODUCTION_HOST

export const getIsStaging = (): boolean => getHost() === STAGING_HOST
