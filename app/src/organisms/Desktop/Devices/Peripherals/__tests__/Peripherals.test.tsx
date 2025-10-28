import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Peripherals } from '..'
import { CameraCard } from '../CameraCard'

import type { PeripheralsProps } from '..'

vi.mock('../CameraCard')

const render = (props: PeripheralsProps) => {
  return renderWithProviders(<Peripherals {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Peripherals', () => {
  let mockProps: PeripheralsProps

  beforeEach(() => {
    mockProps = {
      isFlex: false,
      robotName: 'test-otie',
    }
    vi.mocked(CameraCard).mockReturnValue(<div>MOCK_CAMERA_CARD</div>)
  })

  it('renders peripherals header', () => {
    render(mockProps)

    screen.getByText('Peripherals')
  })

  it('renders CameraCard with correct props for non-Flex robot', () => {
    render(mockProps)

    screen.getByText('MOCK_CAMERA_CARD')
    expect(vi.mocked(CameraCard)).toHaveBeenCalledWith(
      {
        isFlex: false,
        robotName: 'test-otie',
      },
      {}
    )
  })

  it('renders CameraCard with correct props for Flex robot', () => {
    const flexProps = {
      ...mockProps,
      robotName: 'test-flex',
      isFlex: true,
    }
    render(flexProps)

    screen.getByText('MOCK_CAMERA_CARD')
    expect(vi.mocked(CameraCard)).toHaveBeenCalledWith(
      {
        isFlex: true,
        robotName: 'test-flex',
      },
      {}
    )
  })
})
