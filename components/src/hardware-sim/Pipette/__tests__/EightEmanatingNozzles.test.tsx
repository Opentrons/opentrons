import * as React from 'react'
import { render } from '@testing-library/react'
import { when } from 'jest-when'
import { anyProps } from '../../../testing/utils'
import { EightEmanatingNozzles } from '../EightEmanatingNozzles'
import { EmanatingNozzle } from '../EmanatingNozzle'

jest.mock('../EmanatingNozzle')

const mockEmanatingNozzle = EmanatingNozzle as jest.MockedFunction<
  typeof EmanatingNozzle
>

describe('EightEmanatingNozzles', () => {
  beforeEach(() => {
    when(mockEmanatingNozzle)
      .calledWith(anyProps())
      .mockReturnValue(<div>mock emanating nozzle</div>)
  })
  it('should render eight emanating nozzles', () => {
    render(<EightEmanatingNozzles cx={5} initialCy={10} />)
    expect(mockEmanatingNozzle).toHaveBeenCalledTimes(8)
  })
})
