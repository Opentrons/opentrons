import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useModuleRenderInfoById } from '../../../ProtocolSetup/hooks'
import { PowerOn } from '../PowerOn'

jest.mock('../../../ProtocolSetup/hooks')

const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>

const render = (props: React.ComponentProps<typeof PowerOn>) => {
  return renderWithProviders(<PowerOn {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PowerOn', () => {
  let props: React.ComponentProps<typeof PowerOn>

  beforeEach(() => {
    props = {
      robotName: 'Name',
    }

    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText } = render(props)

    getByText('Step 3 of 4: Power on the module')
    getByText('Connect your module to the robot and and power it on.')
  })

  // TODO(jr, 2022-02-18): add test when heaterShaker moduleDef and SVG exist
  it.todo('renders heater shaker SVG with info with module not connected')

  it.todo('renders heater shaker SVG with info with module connected')
})
