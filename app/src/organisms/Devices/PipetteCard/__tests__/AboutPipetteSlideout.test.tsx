import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'
import { LEFT } from '../../../../redux/pipettes'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

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
      onCloseClick: jest.fn(),
    }
    mockUseInstrumentsQuery.mockReturnValue({
      data: { data: [] },
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct info', () => {
    const { getByText, getByRole } = render(props)

    getByText('About Left Pipette Pipette')
    getByText('123')
    getByText('Serial Number')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders the firmware version if it exists', () => {
    mockUseInstrumentsQuery.mockReturnValue({
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

    const { getByText } = render(props)

    getByText('Current Version')
    getByText('12')
  })
})
