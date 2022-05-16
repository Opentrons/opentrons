import * as React from 'react'
import { when } from 'jest-when'
import {
  componentPropsMatcher,
  LabwareRender,
  partialComponentPropsMatcher,
  renderWithProviders,
  RobotWorkSpace,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { mockDefinition } from '../../../../redux/custom-labware/__fixtures__'
import { Introduction } from '../Introduction'
import type { ThermalAdapterName } from '@opentrons/shared-data'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})

const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const render = (props: React.ComponentProps<typeof Introduction>) => {
  return renderWithProviders(<Introduction {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Introduction', () => {
  let props: React.ComponentProps<typeof Introduction>
  beforeEach(() => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: null,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText, getByAltText } = render(props)

    getByText(
      'Use this guide to attach the Heater-Shaker Module to your robot’s deck for secure shaking.'
    )
    getByText('You will need:')
    getByText('Thermal Adapter + Screw')
    getByText('Screw may already be in the center of the module.')
    getByText('Labware')
    getByText('Heater-Shaker Module')
    getByText('T10 Torx Screwdriver')
    getByText(
      'Provided with module. Note: using another screwdriver size can strip the module’s screws.'
    )
    getByAltText('heater_shaker_image')
    getByAltText('screwdriver_image')
  })
  it('renders the correct body when protocol has been uploaded with PCR adapter', () => {
    props = {
      labwareDefinition: mockDefinition,
      thermalAdapterName: 'PCR Adapter' as ThermalAdapterName,
    }
    when(mockRobotWorkSpace)
      .mockReturnValue(<div></div>)
      .calledWith(
        partialComponentPropsMatcher({
          deckDef: standardDeckDef,
          children: expect.anything(),
        })
      )
      .mockImplementation(({ children }) => (
        <svg>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children({
            deckSlotsById,
            getRobotCoordsFromDOMCoords: {} as any,
          })}
        </svg>
      ))

    when(mockLabwareRender)
      .mockReturnValue(<div></div>)
      .calledWith(
        componentPropsMatcher({
          definition: mockDefinition,
        })
      )

    const { getByText, getByAltText } = render(props)
    getByText('Mock Definition')
    getByText('PCR Adapter + Screw')
    getByAltText('PCR Adapter')
  })
  it('renders the correct thermal adapter info when name is Universal Flat Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: 'Universal Flat Adapter',
    }

    const { getByText, getByAltText } = render(props)
    getByText('Universal Flat Adapter + Screw')
    getByAltText('Universal Flat Adapter')
  })
  it('renders the correct thermal adapter info when name is Deep Well Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: 'Deep Well Adapter',
    }

    const { getByText, getByAltText } = render(props)
    getByText('Deep Well Adapter + Screw')
    getByAltText('Deep Well Adapter')
  })
  it('renders the correct thermal adapter info when name is 96 Flat Bottom Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: '96 Flat Bottom Adapter',
    }

    const { getByText, getByAltText } = render(props)
    getByText('96 Flat Bottom Adapter + Screw')
    getByAltText('96 Flat Bottom Adapter')
  })
})
