import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { i18n } from '../../../../../../i18n'
import { mockHeaterShaker } from '../../../../../../redux/modules/__fixtures__'
import { ModuleRenderInfoForProtocol } from '../../../../../Devices/hooks'
import { HeaterShakerBanner } from '../HeaterShakerBanner'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

const mockHeaterShakerDefinition = {
  moduleId: 'someHeaterShakerModule',
  model: 'heaterShakerModuleV1' as ModuleModel,
  type: 'heaterShakerModuleType' as ModuleType,
  displayName: 'Heater Shaker Module',
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  attachedModuleMatch: mockHeaterShaker,
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShakerDefinition as any,
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
  moduleDef: mockHeaterShakerDefinition as any,
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
      modules: [HEATER_SHAKER_PROTOCOL_MODULE_INFO],
    }
  })

  it('should render banner component body', () => {
    const { getByText } = render(props)
    getByText(
      'An improperly fastened Heater-Shaker module can shake itself out of a deck slot.'
    )
  })

  it('should render heater shaker wizard button when a heater shaker is present', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'View instructions' })
  })

  it('should not render heater shaker wizard button if no heater shaker is present', () => {
    props = {
      modules: [],
    }
    const { queryByRole } = render(props)
    expect(
      queryByRole('button', { name: 'View instructions' })
    ).not.toBeInTheDocument()
  })

  it('should render two heater shaker banner items when there are two heater shakers in the protocol', () => {
    props = {
      modules: [
        HEATER_SHAKER_PROTOCOL_MODULE_INFO,
        HEATER_SHAKER_PROTOCOL_MODULE_INFO_2,
      ],
    }

    const { getByText } = render(props)
    getByText('Attach Heater Shaker Module in Slot 1 before proceeding')
    getByText('Attach Heater Shaker Module in Slot 3 before proceeding')
  })
})
