import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { PipetteCard } from '..'
import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'
import { LEFT, RIGHT } from '@opentrons/shared-data'

jest.mock('../PipetteOverflowMenu')

const mockPipetteOverflowMenu = PipetteOverflowMenu as jest.MockedFunction<
  typeof PipetteOverflowMenu
>

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  beforeEach(() => {
    mockPipetteOverflowMenu.mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information for a left pipette', () => {
    const { getByText } = render({
      pipetteInfo: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
    })
    getByText('left Mount')
    getByText('Left Pipette')
  })
  it('renders information for a right pipette', () => {
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
    })
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for no pipette on right Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: RIGHT,
      robotName: mockRobotName,
    })
    getByText('right Mount')
    getByText('Empty')
  })
  it('renders information for no pipette on left Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: LEFT,
      robotName: mockRobotName,
    })
    getByText('left Mount')
    getByText('Empty')
  })
  it('renders kebab icon and is clickable', () => {
    const { getByRole, getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
    })

    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })

    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    getByText('mock pipette overflow menu')
  })
})
