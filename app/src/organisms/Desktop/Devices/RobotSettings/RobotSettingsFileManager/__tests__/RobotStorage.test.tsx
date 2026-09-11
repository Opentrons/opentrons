import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RobotStorage } from '../RobotStorage'

const render = () =>
  renderWithProviders(<RobotStorage />, { i18nInstance: i18n })

describe('RobotStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the robot storage heading', () => {
    render()
    screen.getByText('Robot Storage')
  })

  it('renders the file capacity label', () => {
    render()
    screen.getByText('File capacity')
  })
})
