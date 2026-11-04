import { getIsProduction } from '/protocol-designer/networking/opentronsWebApi'

export const getOt2DesignerCreateUrl = (): string => {
  const OT2_APP_PROD_URL = 'https://ot2.designer.opentrons.com/#/createNew'
  const OT2_APP_STAGE_URL =
    'https://ot2.staging.designer.opentrons.com/#/createNew'

  if (getIsProduction()) {
    return OT2_APP_PROD_URL
  }
  return OT2_APP_STAGE_URL
}
