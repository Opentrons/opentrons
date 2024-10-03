import type * as React from 'react'
import { describe, it, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { SetupLiquids } from '../index'
import { SetupLiquidsList } from '../SetupLiquidsList'
import { SetupLiquidsMap } from '../SetupLiquidsMap'

vi.mock('../SetupLiquidsList')
vi.mock('../SetupLiquidsMap')

describe('SetupLiquids', () => {
  const render = (
    props: React.ComponentProps<typeof SetupLiquids> & {
      startConfirmed?: boolean
    }
  ) => {
    let isConfirmed =
      props?.startConfirmed == null ? false : props.startConfirmed
    const confirmFn = vi.fn((confirmed: boolean) => {
      isConfirmed = confirmed
    })
    return renderWithProviders(
      <SetupLiquids
        runId="123"
        protocolAnalysis={null}
        isLiquidSetupConfirmed={isConfirmed}
        setLiquidSetupConfirmed={confirmFn}
        robotName="robotName"
      />,
      {
        i18nInstance: i18n,
      }
    )
  }

  let props: React.ComponentProps<typeof SetupLiquids>
  beforeEach(() => {
    vi.mocked(SetupLiquidsList).mockReturnValue(
      <div>Mock setup liquids list</div>
    )
    vi.mocked(SetupLiquidsMap).mockReturnValue(
      <div>Mock setup liquids map</div>
    )
  })

  it('renders the list and map view buttons and proceed button', () => {
    render(props)
    screen.getByRole('button', { name: 'List View' })
    screen.getByRole('button', { name: 'Map View' })
    screen.getByRole('button', { name: 'Confirm locations and volumes' })
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
