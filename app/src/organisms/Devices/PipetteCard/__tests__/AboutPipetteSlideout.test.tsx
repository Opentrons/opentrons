import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'
import { LEFT } from '../../../../redux/pipettes'

vi.mock('@opentrons/react-api-client')

const render = (props: React.ComponentProps<typeof AboutPipetteSlideout>) => {
  return renderWithProviders(<AboutPipetteSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AboutPipetteSlideout', () => {
  let props: React.ComponentProps<typeof AboutPipetteSlideout>
  beforeEach(() => {
    props = {
      pipetteId: '123',
      pipetteName: mockLeftSpecs.displayName,
      mount: LEFT,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
  })

  it('renders correct info', () => {
    render(props)

    screen.getByText('About Left Pipette Pipette')
    screen.getByText('123')
    screen.getByText('SERIAL NUMBER')
    const button = screen.getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders the firmware version if it exists', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          {
            instrumentType: 'pipette',
            mount: LEFT,
            ok: true,
            firmwareVersion: 12,
          } as any,
        ],
      },
    } as any)

    render(props)

    screen.getByText('CURRENT VERSION')
    screen.getByText('12')
  })
})
