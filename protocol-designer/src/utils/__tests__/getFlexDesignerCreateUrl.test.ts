import { afterEach, describe, expect, it } from 'vitest'

import { getFlexDesignerCreateUrl } from '../getFlexDesignerCreateUrl'

const FLEX_APP_PROD_URL = 'https://designer.opentrons.com/#/createNew'
const FLEX_APP_STAGE_URL = 'https://staging.designer.opentrons.com/#/createNew'

const setHost = (host: string): void => {
  Object.defineProperty(global, 'location', {
    value: { host },
    writable: true,
    configurable: true,
  })
}

describe('getFlexDesignerCreateUrl', () => {
  afterEach(() => {
    setHost('localhost')
  })

  it('returns prod Flex create URL on ot2.designer.opentrons.com', () => {
    setHost('ot2.designer.opentrons.com')
    expect(getFlexDesignerCreateUrl()).toBe(FLEX_APP_PROD_URL)
  })

  it('returns staging Flex create URL on ot2.staging.designer.opentrons.com', () => {
    setHost('ot2.staging.designer.opentrons.com')
    expect(getFlexDesignerCreateUrl()).toBe(FLEX_APP_STAGE_URL)
  })
})
