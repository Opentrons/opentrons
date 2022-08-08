import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { useAllLabware } from '../../../pages/Labware/hooks'
import { mockOpentronsLabwareDetailsDefinition } from '../../../redux/custom-labware/__fixtures__'
import { CustomLabwareOverflowMenu } from '../../LabwareCard/CustomLabwareOverflowMenu'

import { LabwareDetails } from '..'

// import type { LabwareDefAndDate } from '../../../pages/Labware/hooks'

jest.mock('../../../pages/Labware/hooks')
jest.mock('../../LabwareCard/CustomLabwareOverflowMenu')

const mockCustomLabwareOverflowMenu = CustomLabwareOverflowMenu as jest.MockedFunction<
  typeof CustomLabwareOverflowMenu
>
const mockUseAllLabware = useAllLabware as jest.MockedFunction<
  typeof useAllLabware
>

const render = (
  props: React.ComponentProps<typeof LabwareDetails>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<LabwareDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LabwareDetails', () => {
  let props: React.ComponentProps<typeof LabwareDetails>
  beforeEach(() => {
    mockCustomLabwareOverflowMenu.mockReturnValue(
      <div>Mock CustomLabwareOverflowMenu</div>
    )
    mockUseAllLabware.mockReturnValue([
      { definition: mockOpentronsLabwareDetailsDefinition },
    ])
    props = {
      labware: {
        definition: mockOpentronsLabwareDetailsDefinition,
      },
      onClose: jest.fn(),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render correct info for opentrons labware', () => {
    props.labware.definition.namespace = 'opentrons'
    const [{ getByText }] = render(props)

    // slideout title
    // render close button
    // svg
    // image
    // api name label
    getByText('API Name')
    getByText('mock_definition')
    // well count label
    getByText('Well Count')
    // max volume, well shape label
    getByText('max volume')

    getByText('various')
    // svg
    // Footprint (mm) label
    getByText('Footprint (mm)')
    // length label and value
    getByText('length')
    getByText('10.00')
    // width label and value
    getByText('width')
    getByText('20.00')
    // height label and value
    getByText('height')
    getByText('30.00')
    // well measurement (mm) label
    // depth label and value
    // x-size label and value
    // y-size label and value
    // spacing (mm) label and value
    // x-offset label and value
    // y-offset label and value
    // x-spacing label and value
    // y-spacing label and value
    // manufacturer label and value
    getByText('manufacturer')
    getByText('Opentrons')
    // manufacturer/catalog label and value
    // website label and href
  })

  it('should render correct info for custom labware', () => {
    // slideout title
    // custom labware label
    // render close button
    // svg
    // image
    // api name label
    // api name
    // well count label
    // max volume, well shape label
    // svg
    // Footprint (mm) label
    // length label and value
    // width label and value
    // height label and value
    // well measurement (mm) label
    // depth label and value
    // x-size label and value
    // y-size label and value
    // spacing (mm) label and value
    // x-offset label and value
    // y-offset label and value
    // x-spacing label and value
    // y-spacing label and value
    // manufacturer label and value
    // manufacturer/catalog label and value
    // website label and href <- no website
  })

  it('when clicking copy icon, should show tooltip as feedback', () => {})

  it('should close the slideout when clicking the close button', () => {
    const [{ getByTestId }] = render(props)
    const closeButton = getByTestId('labwareDetails_slideout_close_button')
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
})
