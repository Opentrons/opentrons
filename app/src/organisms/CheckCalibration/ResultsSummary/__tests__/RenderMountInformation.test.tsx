import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { i18n } from '../../../../i18n'
import { LEFT, RIGHT } from '../../../../redux/pipettes'
import * as Fixtures from '../../../../redux/sessions/__fixtures__'
import { RenderMountInformation } from '../RenderMountInformation'

jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getPipetteModelSpecs: jest.fn(),
}))

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails
const mockGetPipetteModelSpecs = getPipetteModelSpecs as jest.MockedFunction<
  typeof getPipetteModelSpecs
>
const render = (props: React.ComponentProps<typeof RenderMountInformation>) => {
  return renderWithProviders(<RenderMountInformation {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RenderMountInformation', () => {
  let props: React.ComponentProps<typeof RenderMountInformation>

  beforeEach(() => {
    props = {
      mount: LEFT,
      pipette: mockSessionDetails.instruments[0],
    }
    mockGetPipetteModelSpecs.mockReturnValue({
      displayName: 'mock pipette display name',
    } as any)
  })

  it('should render left mount with mock pipette', () => {
    const { getByText } = render(props)
    getByText('left MOUNT')
    getByText('mock pipette display name')
  })

  it('should render right mount with mock pipette', () => {
    props.mount = RIGHT
    const { getByText } = render(props)
    getByText('right MOUNT')
    getByText('mock pipette display name')
  })

  it('should render empty without pipette', () => {
    props.pipette = undefined
    const { getByText } = render(props)
    getByText('left MOUNT')
    getByText('empty')
  })
})
