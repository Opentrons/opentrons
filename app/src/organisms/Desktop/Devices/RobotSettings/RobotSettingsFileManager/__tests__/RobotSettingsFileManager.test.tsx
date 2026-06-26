import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { RobotSettingsFileManager } from '../index'
import { ProtocolRunRecords } from '../ProtocolRunRecords'
import { RobotStorage } from '../RobotStorage'

vi.mock('../RobotStorage')
vi.mock('../ProtocolRunRecords')

const render = () => renderWithProviders(<RobotSettingsFileManager />)

describe('RobotSettingsFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(RobotStorage).mockReturnValue(<div>mock robot storage</div>)
    vi.mocked(ProtocolRunRecords).mockReturnValue(
      <div>mock protocol run records</div>
    )
  })

  it('renders robot storage', () => {
    render()
    screen.getByText('mock robot storage')
  })

  it('renders protocol run records', () => {
    render()
    screen.getByText('mock protocol run records')
  })
})
