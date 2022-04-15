import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PipetteOverflowMenu } from '../pipetteOverflowMenu'
import { PipetteCard } from '..'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../../redux/pipettes/__fixtures__'

jest.mock('../pipetteOverflowMenu')

const mockPipetteOverflowMenu = PipetteOverflowMenu as jest.MockedFunction<
  typeof PipetteOverflowMenu
>

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

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
      leftPipette: mockLeftProtoPipette,
    })
    getByText('left Mount')
    getByText('Left Pipette')
  })
  it('renders information for a right pipette', () => {
    const { getByText } = render({
      rightPipette: mockRightProtoPipette,
    })
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for no pipette', () => {
    const { getByText } = render({
      rightPipette: null,
    })
    getByText('right Mount')
    getByText('Empty')
  })
  it('renders kebab icon and is clickable', () => {
    const { getByRole, getByText } = render({
      rightPipette: mockRightProtoPipette,
    })
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    getByText('mock pipette overflow menu')
  })
})
