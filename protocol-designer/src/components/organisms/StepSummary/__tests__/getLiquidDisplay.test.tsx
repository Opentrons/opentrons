import { render, screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { getLiquidDisplay } from '../getLiquidDisplay'

const mockT = (key: string) => key

describe('getLiquidDisplay', () => {
  it('should render the liquid display with 1 liquid', () => {
    const element = getLiquidDisplay(
      [
        {
          displayColor: '000',
          displayName: 'mockLiquid',
          liquidGroupId: '0',
          description: null,
          pythonName: 'mockPythonName',
        },
      ],
      mockT
    )
    render(<>{element}</>)
    screen.getByText('of')
    screen.getByText('mockLiquid')
  })
  it('should render the liquid display with 2 liquids', () => {
    const element = getLiquidDisplay(
      [
        {
          displayColor: '000',
          displayName: 'mockLiquid',
          liquidGroupId: '0',
          description: null,
          pythonName: 'mockPythonName',
        },
        {
          displayColor: '000',
          displayName: 'mockLiquid2',
          liquidGroupId: '1',
          description: null,
          pythonName: 'mockPythonName',
        },
      ],
      mockT
    )
    render(<>{element}</>)
    screen.getByText('of')
    screen.getByText('mockLiquid')
    screen.getByText('and')
    screen.getByText('mockLiquid2')
  })
  it('should render the liquid display with 3 liquids', () => {
    const element = getLiquidDisplay(
      [
        {
          displayColor: '000',
          displayName: 'mockLiquid',
          liquidGroupId: '0',
          description: null,
          pythonName: 'mockPythonName',
        },
        {
          displayColor: '000',
          displayName: 'mockLiquid2',
          liquidGroupId: '1',
          description: null,
          pythonName: 'mockPythonName',
        },
        {
          displayColor: '000',
          displayName: 'mockLiquid3',
          liquidGroupId: '2',
          description: null,
          pythonName: 'mockPythonName',
        },
      ],
      mockT
    )
    render(<>{element}</>)
    screen.getByText('of')
    screen.getByText('liquids')
  })
})
