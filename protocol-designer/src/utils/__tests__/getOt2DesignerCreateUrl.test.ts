import { describe, expect, it, vi } from 'vitest'

import { getIsProduction } from '/protocol-designer/networking/opentronsWebApi'

import { getOt2DesignerCreateUrl } from '../getOt2DesignerCreateUrl'

vi.mock('/protocol-designer/networking/opentronsWebApi')

describe('getOt2DesignerCreateUrl', () => {
  it('should return the production url when getIsProduction is true', () => {
    vi.mocked(getIsProduction).mockReturnValue(true)
    const result = getOt2DesignerCreateUrl()
    expect(result).toBe('https://ot2.designer.opentrons.com/#/createNew')
  })

  it('should return the staging url when getIsProduction is false', () => {
    vi.mocked(getIsProduction).mockReturnValue(false)
    const result = getOt2DesignerCreateUrl()
    expect(result).toBe(
      'https://ot2.staging.designer.opentrons.com/#/createNew'
    )
  })
})
