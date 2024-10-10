import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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
