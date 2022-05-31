import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { ConfigurePipette } from '../../../ConfigurePipette'
import { PipetteSettingsSlideout } from '../PipetteSettingsSlideout'

import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'

jest.mock('../../../ConfigurePipette')

const mockConfigurePipette = ConfigurePipette as jest.MockedFunction<
  typeof ConfigurePipette
>

const render = (
  props: React.ComponentProps<typeof PipetteSettingsSlideout>
) => {
  return renderWithProviders(<PipetteSettingsSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mock robotName'

describe('PipetteSettingsSlideout', () => {
  let props: React.ComponentProps<typeof PipetteSettingsSlideout>
  beforeEach(() => {
    props = {
      mount: 'left',
      robotName: mockRobotName,
      pipetteName: mockLeftSpecs.displayName,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    mockConfigurePipette.mockReturnValue(<div>mock configure pipette</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct text', () => {
    const { getByText, getByRole } = render(props)

    getByText('Left Pipette Settings')
    getByText('mock configure pipette')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
