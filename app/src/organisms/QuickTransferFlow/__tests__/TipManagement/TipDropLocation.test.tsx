import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { TipDropLocation } from '../../TipManagement/TipDropLocation'

vi.mock('/app/resources/deck_configuration')

const render = (props: React.ComponentProps<typeof TipDropLocation>): any => {
  return renderWithProviders(<TipDropLocation {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipDropLocation', () => {
  let props: React.ComponentProps<typeof TipDropLocation>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: {
        dropTipLocation: 'trashBin',
      } as any,
      dispatch: vi.fn(),
    }
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutC3',
          cutoutFixtureId: 'wasteChuteRightAdapterCovered',
        },
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: 'trashBinAdapter',
        },
      ],
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders tip drop location screen, header and save button', () => {
    render(props)
    screen.getByText('Tip drop location')
    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)
    expect(props.onBack).toHaveBeenCalled()
  })
  it('renders options for each dipsosal location in deck config', () => {
    render(props)
    screen.getByText('Trash bin in A3')
    screen.getByText('Waste chute in C3')
  })
  it('calls dispatch when you select a new option and save', () => {
    render(props)
    const wasteChute = screen.getByText('Waste chute in C3')
    fireEvent.click(wasteChute)
    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
  })
})
