import * as React from 'react'
import { describe, it, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { SetupLiquids } from '../index'
import { SetupLiquidsList } from '../SetupLiquidsList'
import { SetupLiquidsMap } from '../SetupLiquidsMap'
import { BackToTopButton } from '../../BackToTopButton'

vi.mock('../SetupLiquidsList')
vi.mock('../SetupLiquidsMap')
vi.mock('../../BackToTopButton')

const render = (props: React.ComponentProps<typeof SetupLiquids>) => {
  return renderWithProviders(
    <SetupLiquids
      robotName="otie"
      runId="123"
      protocolRunHeaderRef={null}
      protocolAnalysis={null}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetupLiquids', () => {
  let props: React.ComponentProps<typeof SetupLiquids>
  beforeEach(() => {
    vi.mocked(SetupLiquidsList).mockReturnValue(
      <div>Mock setup liquids list</div>
    )
    vi.mocked(SetupLiquidsMap).mockReturnValue(
      <div>Mock setup liquids map</div>
    )
    vi.mocked(BackToTopButton).mockReturnValue(
      <button>Mock BackToTopButton</button>
    )
  })

  it('renders the list and map view buttons and proceed button', () => {
    render(props)
    screen.getByRole('button', { name: 'List View' })
    screen.getByRole('button', { name: 'Map View' })
    screen.getByRole('button', { name: 'Mock BackToTopButton' })
  })
  it('renders the map view when you press that toggle button', () => {
    render(props)
    const mapViewButton = screen.getByRole('button', { name: 'Map View' })
    fireEvent.click(mapViewButton)
    screen.getByText('Mock setup liquids map')
  })
  it('renders the list view when you press that toggle button', () => {
    render(props)
    const mapViewButton = screen.getByRole('button', { name: 'List View' })
    fireEvent.click(mapViewButton)
    screen.getByText('Mock setup liquids list')
  })
})
