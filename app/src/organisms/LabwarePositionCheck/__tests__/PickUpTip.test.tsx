import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { useProtocolMetadata } from '../../Devices/hooks'
import { PickUpTip } from '../PickUpTip'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis, mockExistingOffsets } from '../__fixtures__'
import type { CommandData } from '@opentrons/api-client'

jest.mock('../../Devices/hooks')

const mockStartPosition = { x: 10, y: 20, z: 30 }

const mockUseProtocolMetaData = useProtocolMetadata as jest.MockedFunction<
  typeof useProtocolMetadata
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

const render = (props: React.ComponentProps<typeof PickUpTip>) => {
  return renderWithProviders(<PickUpTip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PickUpTip', () => {
  let props: React.ComponentProps<typeof PickUpTip>
  let mockChainRunCommands: jest.Mock

  beforeEach(() => {
    mockChainRunCommands = jest.fn().mockImplementation(() => Promise.resolve())
    props = {
      section: SECTIONS.PICK_UP_TIP,
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
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('renders correct copy when preparing space', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare tip rack in slot D1' })
    getByText('Clear all deck slots of labware, leaving modules in place')
    getByText(
      matchTextWithSpans('Place a full Mock TipRack Definition into slot D1')
    )
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('renders correct copy when confirming position', () => {
    const { getByText, getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: 'D1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })
    getByRole('heading', { name: 'Pick up tip from tip rack in slot D1' })
    getByText(
      "Ensure that the pipette nozzle furthest from you is centered above and level with the top of the tip in the A1 position. If it isn't, use the controls below or your keyboard to jog the pipette until it is properly aligned."
    )
    getByRole('link', { name: 'Need help?' })
  })
  it('executes correct chained commands when confirm placement CTA is clicked', async () => {
    when(mockChainRunCommands)
      .calledWith(
        [{ commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } }],
        false
      )
      .mockImplementation(() => Promise.resolve([{} as CommandData]))
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
            wellLocation: { origin: 'top', offset: undefined },
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

  it('executes correct chained commands when confirm position CTA is clicked and user tries again', async () => {
    when(mockChainRunCommands)
      .calledWith(
        [{ commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } }],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockStartPosition },
            },
          },
          {},
          {},
        ])
      )

    when(mockChainRunCommands)
      .calledWith(
        [
          {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          {
            commandType: 'pickUpTip',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
            },
          },
          {
            command: {
              commandType: 'dropTip',
              params: {
                pipetteId: 'pipetteId1',
                labwareId: 'labwareId1',
                wellName: 'A1',
              },
            },
            waitUntilComplete: true,
          },
        ],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockStartPosition },
            },
          },
          {},
          {},
        ])
      )

    const { getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: 'D1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })

    getByRole('button', { name: 'forward' }).click()
    expect(props.handleJog).toHaveBeenCalled()
    await getByRole('button', { name: 'Confirm position' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: { x: 10, y: 20, z: 30 },
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(2, {
      type: 'tipPickUpOffset',
      offset: { x: 9, y: 18, z: 27 },
    })
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      2,
      [
        {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
          },
        },
      ],
      false
    )
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    getByRole('button', { name: 'Try again' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      3,
      [
        {
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
          },
        },
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top' },
          },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(3, {
      type: 'tipPickUpOffset',
      offset: null,
    })
  })
  it('proceeds after confirm position and pick up tip', async () => {
    when(mockChainRunCommands)
      .calledWith(
        [{ commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } }],
        false
      )
      .mockImplementation(() =>
        Promise.resolve([
          {
            data: {
              commandType: 'savePosition',
              result: { position: mockStartPosition },
            },
          },
          {},
          {},
        ])
      )

    when(mockChainRunCommands)
      .calledWith(
        [
          {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          {
            commandType: 'pickUpTip',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
            },
          },
          {
            commandType: 'dropTip',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
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
              result: { position: mockStartPosition },
            },
          },
          {},
          {},
        ])
      )
    const { getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: 'D1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })

    await getByRole('button', { name: 'Confirm position' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
      ],
      false
    )
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: 'D1' },
      position: { x: 10, y: 20, z: 30 },
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(2, {
      type: 'tipPickUpOffset',
      offset: { x: 9, y: 18, z: 27 },
    })
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      2,
      [
        {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
          },
        },
      ],
      false
    )
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    await getByRole('button', { name: 'Yes' }).click()

    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      3,
      [
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
    await expect(props.proceed).toHaveBeenCalled()
  })
  it('executes heater shaker closed latch commands for every hs module before other commands', () => {
    props = {
      ...props,
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
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: 'firstHSId' },
        },
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: 'secondHSId' },
        },
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
            wellLocation: { origin: 'top' },
          },
        },
        { commandType: 'savePosition', params: { pipetteId: 'pipetteId1' } },
      ],
      false
    )
  })
})
