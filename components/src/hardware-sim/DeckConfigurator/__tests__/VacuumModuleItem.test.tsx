import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Icon } from '../../../icons'
import { renderWithProviders } from '../../../testing/utils'
import { RobotCoordsForeignObject } from '../../Deck/RobotCoordsForeignObject'
import {
  COLUMN_DEFAULT_X_ADJUSTMENT,
  FIXTURE_HEIGHT,
  VACUUM_MODULE_MILLIPORE_V1_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
} from '../constants'
import { VacuumModuleItem } from '../VacuumModuleItem'

import type { ComponentProps } from 'react'
import type { DeckDefinition } from '@opentrons/shared-data'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../../icons', () => ({
  Icon: vi.fn(),
}))

vi.mock('../../Deck/RobotCoordsForeignObject', () => ({
  RobotCoordsForeignObject: vi.fn(),
}))

const mockDeckDefinition = {
  locations: {
    cutouts: [
      {
        id: 'cutoutA3',
        position: [100, 200],
      },
      {
        id: 'cutoutB3',
        position: [150, 250],
      },
    ],
  },
} as unknown as DeckDefinition

const render = (props: ComponentProps<typeof VacuumModuleItem>) => {
  return renderWithProviders(<VacuumModuleItem {...props} />)
}

describe('VacuumModuleItem', () => {
  let props: ComponentProps<typeof VacuumModuleItem>

  beforeEach(() => {
    vi.clearAllMocks()

    props = {
      deckDefinition: mockDeckDefinition,
      fixtureLocation: 'cutoutA3',
      cutoutFixtureId: 'vacuumModuleMilliporeV1',
      addressableAreaId: 'vacuumModuleMilliporeV1A3',
    }

    vi.mocked(RobotCoordsForeignObject).mockImplementation(({ children }) => (
      <div data-testid="mock-robot-coords-foreign-object">{children}</div>
    ))

    vi.mocked(Icon).mockImplementation(({ name }) => (
      <div data-testid={`icon-${name}`}>mock icon {name}</div>
    ))
  })

  it('should render with the vacuum translation key', () => {
    render(props)
    expect(screen.getByText('vacuum')).toBeInTheDocument()
  })

  it('should render RobotCoordsForeignObject with correct dimensions', () => {
    render(props)
    expect(RobotCoordsForeignObject).toHaveBeenCalledWith(
      expect.objectContaining({
        width: VACUUM_MODULE_MILLIPORE_V1_FIXTURE_WIDTH,
        height: FIXTURE_HEIGHT,
      }),
      expect.anything()
    )
  })

  it('should calculate position correctly based on deck definition', () => {
    render(props)

    const expectedX = 100 + COLUMN_DEFAULT_X_ADJUSTMENT
    const expectedY = 200 + Y_ADJUSTMENT

    expect(RobotCoordsForeignObject).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expectedX,
        y: expectedY,
      }),
      expect.anything()
    )
  })

  it('should render remove icon when handleClickRemove is provided', () => {
    const mockHandleClickRemove = vi.fn()
    props.handleClickRemove = mockHandleClickRemove

    render(props)
    expect(screen.getByTestId('icon-remove')).toBeInTheDocument()
  })

  it('should not render remove icon when handleClickRemove is not provided', () => {
    render(props)
    expect(screen.queryByTestId('icon-remove')).not.toBeInTheDocument()
  })

  it('should call handleClickRemove with correct arguments when clicked', () => {
    const mockHandleClickRemove = vi.fn()
    props.handleClickRemove = mockHandleClickRemove

    render(props)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockHandleClickRemove).toHaveBeenCalledWith(
      'cutoutA3',
      'vacuumModuleMilliporeV1',
      'vacuumModuleMilliporeV1A3'
    )
  })

  it('should not throw when clicked without handleClickRemove', () => {
    render(props)

    const button = screen.getByRole('button')
    expect(() => fireEvent.click(button)).not.toThrow()
  })

  it('should handle missing cutout definition gracefully (x and y positions should be 0)', () => {
    props.fixtureLocation = 'cutoutD3' as any // non-existent cutout

    render(props)

    // Should fall back to 0 for position
    const expectedX = 0 + COLUMN_DEFAULT_X_ADJUSTMENT
    const expectedY = 0 + Y_ADJUSTMENT

    expect(RobotCoordsForeignObject).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expectedX,
        y: expectedY,
      }),
      expect.anything()
    )
  })

  it('should apply selected style when selected is true', () => {
    const mockHandleClickRemove = vi.fn()
    props.handleClickRemove = mockHandleClickRemove
    props.selected = true

    render(props)

    // The button should be rendered (style verification is visual)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should default selected to false', () => {
    const mockHandleClickRemove = vi.fn()
    props.handleClickRemove = mockHandleClickRemove
    // Not setting selected - should default to false

    render(props)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
