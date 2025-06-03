import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EightEmanatingNozzles } from '../EightEmanatingNozzles'
import { EmanatingNozzle } from '../EmanatingNozzle'

vi.mock('../EmanatingNozzle')

describe('EightEmanatingNozzles', () => {
  beforeEach(() => {
    vi.mocked(EmanatingNozzle).mockReturnValue(<div>mock emanating nozzle</div>)
  })
  it('should render eight emanating nozzles', () => {
    render(<EightEmanatingNozzles cx={5} initialCy={10} />)
    expect(EmanatingNozzle).toHaveBeenCalledTimes(8)
  })
})
