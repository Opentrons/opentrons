import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { RobotConfigurationDetails } from '../RobotConfigurationDetails'
import { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

const mockRequiredModuleDetails = [
  {
    id: 'someId',
    createdAt: '2022-04-18T19:16:57.398363+00:00',
    commandType: 'loadModule',
    key: 'someKey',
    status: 'succeeded',
    params: {
      model: 'magneticModuleV2',
      location: {
        slotName: '1',
      },
      moduleId: 'magneticModuleType',
    },
    result: {
      moduleId: 'magneticModuleType',
      definition: {
        otSharedSchema: 'module/schemas/2',
        moduleType: 'magneticModuleType',
        model: 'magneticModuleV2',
        labwareOffset: {
          x: -1.175,
          y: -0.125,
          z: 82.25,
        },
        dimensions: {
          bareOverallHeight: 110.152,
          overLabwareHeight: 4.052,
          lidHeight: null,
        },
        calibrationPoint: {
          x: 124.875,
          y: 2.75,
        },
        displayName: 'Magnetic Module GEN2',
        quirks: [],
        slotTransforms: {},
        compatibleWith: [],
      },
      model: 'magneticModuleV2',
      serialNumber: 'fake-serial-number',
    },
    error: null,
    startedAt: '2022-04-18T19:16:57.401628+00:00',
    completedAt: '2022-04-18T19:16:57.402112+00:00',
  } as LoadModuleRunTimeCommand,
]

const render = (
  props: React.ComponentProps<typeof RobotConfigurationDetails>
) => {
  return renderWithProviders(<RobotConfigurationDetails {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RobotConfigurationDetails', () => {
  let props: React.ComponentProps<typeof RobotConfigurationDetails>
  beforeEach(() => {})
  it('renders left mount pipette when there is a pipette only in the left mount', () => {
    props = {
      leftMountPipetteName: 'p10_single',
      rightMountPipetteName: null,
      requiredModuleDetails: null,
      isLoading: false,
    }
    const { getByText } = render(props)
    getByText('left mount')
    getByText('P10 Single-Channel GEN1')
    getByText('right mount')
    getByText('Not Used')
  })

  it('renders right mount pipette when there is a pipette only in the right mount', () => {
    props = {
      leftMountPipetteName: null,
      rightMountPipetteName: 'p10_single',
      requiredModuleDetails: null,
      isLoading: false,
    }
    const { getByText } = render(props)
    getByText('left mount')
    getByText('P10 Single-Channel GEN1')
    getByText('right mount')
    getByText('Not Used')
  })

  it('renders the magnetic module when the protocol contains a magnetic module', () => {
    props = {
      leftMountPipetteName: null,
      rightMountPipetteName: 'p10_single',
      requiredModuleDetails: mockRequiredModuleDetails,
      isLoading: false,
    }

    const { getByText } = render(props)
    getByText('Slot 1')
    getByText('Magnetic Module GEN2')
  })

  it('renders loading for both pipettes when it is in a loading state', () => {
    props = {
      leftMountPipetteName: 'p10_single',
      rightMountPipetteName: null,
      requiredModuleDetails: null,
      isLoading: true,
    }
    const { getAllByText, getByText } = render(props)
    getByText('right mount')
    getAllByText('Loading...')
  })
})
