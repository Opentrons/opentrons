import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { SelectTipDropLocation } from '../SelectTipDropLocation'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/deck_configuration')

const mockData = [
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: 'wasteChuteRightAdapterCovered',
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: 'trashBinAdapter',
  },
]

const render = (props: ComponentProps<typeof SelectTipDropLocation>) => {
  return renderWithProviders(<SelectTipDropLocation {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectTipDropLocation', () => {
  let props: ComponentProps<typeof SelectTipDropLocation>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {},
      dispatch: vi.fn(),
    }
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: mockData,
    } as any)
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select tip drop location')
    screen.getByText('Exit')
    screen.getByText('Continue')
    screen.getByText('Trash bin in A3')
    screen.getByText('Waste chute in C3')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tappin continue button', () => {
    render(props)
    fireEvent.click(screen.getByText('Trash bin in A3'))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_DROP_TIP_LOCATION',
      location: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
      },
    })
  })
})
