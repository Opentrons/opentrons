import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
<<<<<<< HEAD
=======
import { useInstrumentsQuery } from '@opentrons/react-api-client'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'

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
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
<<<<<<< HEAD
=======
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
    props = {
      pipetteId: '123',
      pipetteName: mockLeftSpecs.displayName,
      isExpanded: true,
      firmwareVersion: '12',
      onCloseClick: vi.fn(),
    }
    render(props)

=======
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

>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
    screen.getByText('CURRENT VERSION')
    screen.getByText('12')
  })
})
