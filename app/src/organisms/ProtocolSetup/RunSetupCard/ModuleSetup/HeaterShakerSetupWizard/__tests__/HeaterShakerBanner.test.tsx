import * as React from 'react'
import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { HeaterShakerBanner } from '../HeaterShakerBanner'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import {
  mockApiHeaterShaker,
  mockHeaterShaker,
} from '../../../../../../redux/modules/__fixtures__'
import { ModuleRenderInfoForProtocol } from '../../../../../Devices/hooks'

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  attachedModuleMatch: mockHeaterShaker,
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockApiHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: 'Source Plate',
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '1',
} as ModuleRenderInfoForProtocol

const HEATER_SHAKER_PROTOCOL_MODULE_INFO_2 = {
  attachedModuleMatch: mockHeaterShaker,
  moduleId: 'heater_shaker_id_2',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockApiHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: 'Source Plate',
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '3',
} as ModuleRenderInfoForProtocol

const render = (props: React.ComponentProps<typeof HeaterShakerBanner>) => {
  return renderWithProviders(<HeaterShakerBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerBanner', () => {
  let props: React.ComponentProps<typeof HeaterShakerBanner>
  beforeEach(() => {
    props = {
      displayName: 'HeaterShakerV1',
      modules: [HEATER_SHAKER_PROTOCOL_MODULE_INFO],
    }
  })

  it('should render banner component', () => {
    const { getByText } = render(props)
    getByText('Attach HeaterShakerV1 to deck before proceeding to run')
    getByText(
      'An improperly fastened Heater Shaker module can shake itself out of a deck slot.'
    )
  })

  it('should render heater shaker wizard button when a heater shaker is present', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'View instructions' })
  })

  it('should not render heater shaker wizard button if no heater shaker is present', () => {
    props = {
      displayName: 'HeaterShakerV1',
      modules: [],
    }
    const { queryByRole } = render(props)
    expect(
      queryByRole('button', { name: 'View instructions' })
    ).not.toBeInTheDocument()
  })

  it('should render two heater shaker banner items when there are two heater shakers in the protocol', () => {
    props = {
      displayName: 'HeaterShakerV1',
      modules: [
        HEATER_SHAKER_PROTOCOL_MODULE_INFO,
        HEATER_SHAKER_PROTOCOL_MODULE_INFO_2,
      ],
    }

    const { getByText } = render(props)
    getByText('heatershaker in Slot 1')
    getByText('heatershaker in Slot 3')
  })
})
