import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import { useProtocolMetadata } from '../../Devices/hooks'
import { CheckItem } from '../CheckItem'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis, mockExistingOffsets } from '../__fixtures__'

jest.mock('../../../redux/config')
jest.mock('../../Devices/hooks')

const mockStartPosition = { x: 10, y: 20, z: 30 }
const mockEndPosition = { x: 9, y: 19, z: 29 }

const mockUseProtocolMetaData = useProtocolMetadata as jest.MockedFunction<
  typeof useProtocolMetadata
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

const matchTextWithSpans: (text: string) => MatcherFunction = (
  text: string
) => (_content, node) => {
  const nodeHasText = node?.textContent === text
  const childrenDontHaveText = Array.from(node?.children ?? []).every(
    child => child?.textContent !== text
  )

  return nodeHasText && childrenDontHaveText
}

const render = (props: React.ComponentProps<typeof CheckItem>) => {
  return renderWithProviders(<CheckItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CheckItem', () => {
  let props: React.ComponentProps<typeof CheckItem>
  let mockChainRunCommands: jest.Mock

  beforeEach(() => {
    mockChainRunCommands = jest
      .fn()
      .mockImplementation(() => Promise.resolve([]))
    props = {
      section: SECTIONS.CHECK_LABWARE,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: 'D1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      chainRunCommands: mockChainRunCommands,
      handleJog: jest.fn(),
      registerPosition: jest.fn(),
      setFatalError: jest.fn(),
      workingOffsets: [],
      existingOffsets: mockExistingOffsets,
      isRobotMoving: false,
    }
    mockUseProtocolMetaData.mockReturnValue({ robotType: 'OT-3 Standard' })
    when(mockUseFeatureFlag).calledWith('lpcWithProbe').mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('renders correct copy when preparing space with tip rack', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare tip rack in slot D1' })
    getByText('Clear all deck slots of labware, leaving modules in place')
    getByText(
      matchTextWithSpans('Place a full Mock TipRack Definition into slot D1')
    )
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('renders correct copy when preparing space with non tip rack labware', () => {
    props = {
      ...props,
      labwareId: mockCompletedAnalysis.labware[1].id,
      location: { slotName: 'D2' },
    }

    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare labware in slot D2' })
    getByText('Clear all deck slots of labware, leaving modules in place')
    getByText(
      matchTextWithSpans('Place a Mock Labware Definition into slot D2')
    )
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('executes correct chained commands when confirm placement CTA is clicked then go back', async () => {
    when(mockChainRunCommands)
      .calledWith(
        [
          {
            commandType: 'moveLabware',
            params: {
              labwareId: 'labwareId1',
              newLocation: { slotName: 'D1' },
              strategy: 'manualMoveWithoutPause',
            },
          },
          {
            commandType: 'moveToWell',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 0 } },
            },
          },
          { commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } },
        ],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {},
          {},
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockStartPosition },
            },
          },
        ])
      )
    const { getByRole } = render(props)
    await getByRole('button', { name: 'Confirm placement' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: { slotName: 'D1' },
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 0 } },
          },
        },
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'initialPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: mockStartPosition,
    })
  })
  it('executes correct chained commands when go back clicked', async () => {
    props = {
      ...props,
      workingOffsets: [
        {
          location: { slotName: 'D1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    }
    const { getByRole } = render(props)
    await getByRole('button', { name: 'Go back' }).click()

    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        { commandType: 'home', params: {} },
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'initialPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: null,
    })
  })
  it('executes correct chained commands when confirm position clicked', async () => {
    when(mockChainRunCommands)
      .calledWith(
        [
          {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          {
            commandType: 'retractAxis' as const,
            params: {
              axis: 'leftZ',
            },
          },
          {
            commandType: 'retractAxis' as const,
            params: {
              axis: 'x',
            },
          },
          {
            commandType: 'retractAxis' as const,
            params: {
              axis: 'y',
            },
          },
          {
            commandType: 'moveLabware',
            params: {
              labwareId: 'labwareId1',
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
        ],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockEndPosition },
            },
          },
          {},
          {},
        ])
      )
    props = {
      ...props,
      workingOffsets: [
        {
          location: { slotName: 'D1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    }
    const { getByRole } = render(props)
    await getByRole('button', { name: 'Confirm position' }).click()

    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: 'leftZ',
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'x' },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'y' },
        },
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: mockEndPosition,
    })
  })

  it('executes heater shaker open latch command on component mount if step is on HS', async () => {
    props = {
      ...props,
      location: { slotName: 'D1', moduleModel: HEATERSHAKER_MODULE_V1 },
      moduleId: 'firstHSId',
      protocolData: {
        ...props.protocolData,
        modules: [
          {
            id: 'firstHSId',
            model: HEATERSHAKER_MODULE_V1,
            location: { slotName: 'D3' },
            serialNumber: 'firstHSSerial',
          },
          {
            id: 'secondHSId',
            model: HEATERSHAKER_MODULE_V1,
            location: { slotName: 'A1' },
            serialNumber: 'secondHSSerial',
          },
        ],
      },
    }
    const { getByRole } = render(props)
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: 'firstHSId' },
        },
        {
          commandType: 'heaterShaker/deactivateShaker',
          params: { moduleId: 'firstHSId' },
        },
        {
          commandType: 'heaterShaker/openLabwareLatch',
          params: { moduleId: 'firstHSId' },
        },
      ],
      false
    )
    await getByRole('button', { name: 'Confirm placement' }).click()

    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      2,
      [
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: { moduleId: 'firstHSId' },
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: 'firstHSId' },
        },
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: 'secondHSId' },
        },
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 0 } },
          },
        },
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
      ],
      false
    )
  })

  it('executes thermocycler open lid command on mount if checking labware on thermocycler', () => {
    props = {
      ...props,
      location: { slotName: 'B1', moduleModel: THERMOCYCLER_MODULE_V2 },
      moduleId: 'tcId',
      protocolData: {
        ...props.protocolData,
        modules: [
          {
            id: 'tcId',
            model: THERMOCYCLER_MODULE_V2,
            location: { slotName: 'B1' },
            serialNumber: 'tcSerial',
          },
        ],
      },
    }
    render(props)
    expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'thermocycler/openLid',
          params: { moduleId: 'tcId' },
        },
      ],
      false
    )
  })
  it('executes correct chained commands when confirm placement CTA is clicked when using probe for LPC', async () => {
    when(mockUseFeatureFlag).calledWith('lpcWithProbe').mockReturnValue(true)
    when(mockChainRunCommands)
      .calledWith(
        [
          {
            commandType: 'moveLabware',
            params: {
              labwareId: 'labwareId1',
              newLocation: { slotName: 'D1' },
              strategy: 'manualMoveWithoutPause',
            },
          },
          {
            commandType: 'moveToWell',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 44.5 } },
            },
          },
          { commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } },
        ],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {},
          {},
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockStartPosition },
            },
          },
        ])
      )
    const { getByRole } = render(props)
    await getByRole('button', { name: 'Confirm placement' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: { slotName: 'D1' },
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 44.5 } },
          },
        },
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'initialPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: mockStartPosition,
    })
  })
})
