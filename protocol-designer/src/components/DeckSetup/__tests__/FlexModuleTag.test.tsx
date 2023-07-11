import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { FlexModuleTag } from '../FlexModuleTag'
import type { ModuleDimensions } from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hardware-sim/Deck/RobotCoordsForeignDiv')

const mockRobotCoordsForeignDiv = RobotCoordsForeignDiv as jest.MockedFunction<
  typeof RobotCoordsForeignDiv
>

const render = (props: React.ComponentProps<typeof FlexModuleTag>) => {
  return renderWithProviders(<FlexModuleTag {...props} />)[0]
}

const mockDimensions: ModuleDimensions = {
  labwareInterfaceXDimension: 5,
} as any

describe('FlexModuleTag', () => {
  it('renders the flex module tag for magnetic block', () => {
    when(mockRobotCoordsForeignDiv)
      .calledWith(
        partialComponentPropsMatcher({
          width: 5,
          height: 16,
        })
      )
      .mockImplementation(({ children }) => (
        <div>
          {`rectangle with width 5 and height 16`} {children}
        </div>
      ))
    const { getByText } = render({
      dimensions: mockDimensions,
      displayName: 'mock Magnetic Block',
    })
    getByText('mock Magnetic Block')
    getByText('rectangle with width 5 and height 16')
  })
  it('renders the flex module tag for heater-shaker', () => {
    when(mockRobotCoordsForeignDiv)
      .calledWith(
        partialComponentPropsMatcher({
          width: 5,
          height: 16,
        })
      )
      .mockImplementation(({ children }) => (
        <div>
          {`rectangle with width 5 and height 16`} {children}
        </div>
      ))
    const { getByText } = render({
      dimensions: mockDimensions,
      displayName: 'mock Heater-shaker',
    })
    getByText('mock Heater-shaker')
    getByText('rectangle with width 5 and height 16')
  })
})
