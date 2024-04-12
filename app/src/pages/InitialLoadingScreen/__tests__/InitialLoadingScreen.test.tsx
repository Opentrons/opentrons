import * as React from 'react'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { getIsShellReady } from '../../../redux/shell'

import { InitialLoadingScreen } from '..'

vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')

const render = () => {
  return renderWithProviders(<InitialLoadingScreen />)
}

describe('InitialLoadingScreen', () => {
  beforeEach(() => {
    vi.mocked(getIsShellReady).mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should display spinner', () => {
    render()
    screen.getByLabelText('loading indicator')
  })
})
