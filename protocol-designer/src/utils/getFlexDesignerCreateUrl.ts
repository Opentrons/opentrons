import { getIsProduction } from '/protocol-designer/networking/opentronsWebApi'

export const getFlexDesignerCreateUrl = (): string => {
  const FLEX_APP_PROD_URL = 'https://designer.opentrons.com/#/createNew'
  const FLEX_APP_STAGE_URL =
    'https://staging.designer.opentrons.com/#/createNew'

  if (getIsProduction()) {
    return FLEX_APP_PROD_URL
  }
  return FLEX_APP_STAGE_URL
}
