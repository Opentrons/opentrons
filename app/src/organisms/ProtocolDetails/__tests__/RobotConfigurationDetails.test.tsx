import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { OT2_STANDARD_MODEL, OT3_STANDARD_MODEL } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import { RobotConfigurationDetails } from '../RobotConfigurationDetails'
import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

jest.mock('../../../redux/config')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

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

  beforeEach(() => {
    when(mockUseFeatureFlag)
      .calledWith('enableExtendedHardware')
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('renders a robot section showing the intended robot model for an OT-2 protocol', () => {
    props = {
      leftMountPipetteName: 'p10_single',
      rightMountPipetteName: null,
      requiredModuleDetails: null,
      extensionInstrumentName: null,
      isLoading: false,
      robotType: OT2_STANDARD_MODEL,
    }
    const { getByText } = render(props)
    getByText('robot')
    getByText('OT-2')
  })

  it('renders a robot section showing the intended robot model for an OT-3 protocol', () => {
    props = {
      leftMountPipetteName: 'p10_single',
      rightMountPipetteName: null,
      requiredModuleDetails: null,
      extensionInstrumentName: null,
      isLoading: false,
      robotType: OT3_STANDARD_MODEL,
    }
    const { getByText } = render(props)
    getByText('robot')
    getByText('Opentrons Flex')
  })

  it('renders left mount pipette when there is a pipette only in the left mount', () => {
    props = {
      leftMountPipetteName: 'p10_single',
      rightMountPipetteName: null,
      requiredModuleDetails: null,
      extensionInstrumentName: null,
      isLoading: false,
      robotType: OT2_STANDARD_MODEL,
    }
    const { getByText } = render(props)
    getByText('left mount')
    getByText('P10 Single-Channel GEN1')
    getByText('right mount')
    getByText('empty')
  })

  it('renders right mount pipette when there is a pipette only in the right mount', () => {
    props = {
      leftMountPipetteName: null,
      rightMountPipetteName: 'p10_single',
      requiredModuleDetails: null,
      extensionInstrumentName: null,
      isLoading: false,
      robotType: OT2_STANDARD_MODEL,
    }
    const { getByText } = render(props)
    getByText('left mount')
    getByText('P10 Single-Channel GEN1')
    getByText('right mount')
    getByText('empty')
  })

  it('renders extension mount section when extended hardware feature flag is on', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableExtendedHardware')
      .mockReturnValue(true)

    const { getByText } = render(props)
    getByText('extension mount')
  })

  it('renders the magnetic module when the protocol contains a magnetic module', () => {
    props = {
      leftMountPipetteName: null,
      rightMountPipetteName: 'p10_single',
      extensionInstrumentName: null,
      requiredModuleDetails: mockRequiredModuleDetails,
      isLoading: false,
      robotType: OT2_STANDARD_MODEL,
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
      extensionInstrumentName: null,
      isLoading: true,
      robotType: OT2_STANDARD_MODEL,
    }
    const { getAllByText, getByText } = render(props)
    getByText('right mount')
    getAllByText('Loading...')
  })
})
