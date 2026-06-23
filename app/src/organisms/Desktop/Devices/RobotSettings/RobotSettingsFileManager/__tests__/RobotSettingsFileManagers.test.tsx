import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { RobotSettingsFileManager } from '../index'

vi.mock('../RobotStorage', () => ({
  RobotStorage: () => <div>mock robot storage</div>,
}))

const render = () => renderWithProviders(<RobotSettingsFileManager />)

describe('RobotSettingsFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders robot storage', () => {
    render()
    screen.getByText('mock robot storage')
  })
})
