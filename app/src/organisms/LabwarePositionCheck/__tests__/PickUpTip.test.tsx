import * as React from 'react'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { PickUpTip } from '../PickUpTip'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis, mockExistingOffsets } from '../__fixtures__'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'
import { CommandData } from '@opentrons/api-client'
import { resetAllWhenMocks, when } from 'jest-when'

const mockStartPosition = { x: 10, y: 20, z: 30 }

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
  let mockChainRunCommands
  const mockCreateRunCommand = jest.fn()

  beforeEach(() => {
    mockChainRunCommands = jest.fn().mockImplementation(() => Promise.resolve())
    props = {
      section: SECTIONS.PICK_UP_TIP,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: '1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      createRunCommand: mockCreateRunCommand,
      chainRunCommands: mockChainRunCommands,
      handleJog: jest.fn(),
      registerPosition: jest.fn(),
      workingOffsets: [],
      existingOffsets: mockExistingOffsets,
      isRobotMoving: false,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('renders correct copy when preparing space', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare tip rack in slot 1' })
    getByText('Clear all deck slots of labware')
    getByText(
      matchTextWithSpans('Place a full Mock TipRack Definition into slot 1')
    )
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('renders correct copy when confirming position', () => {
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() => Promise.resolve({} as CommandData))
    const { getByText, getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: '1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })
    getByRole('heading', { name: 'Pick up tip from tip rack in slot 1' })
    getByText(
      "Ensure that the pipette nozzle furthest from you is centered above and level with the top of the tip in the A1 position. If it isn't, use the controls below or your keyboard to jog the pipette until it is properly aligned."
    )
    getByRole('link', { name: 'Need help?' })
  })
  it('executes correct chained commands when confirm placement CTA is clicked', async () => {
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() => Promise.resolve({} as CommandData))
    const { getByRole } = render(props)
    await getByRole('button', { name: 'Confirm placement' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: { slotName: '1' },
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
      ],
      true
    )
    await expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'savePosition',
        params: { pipetteId: 'pipetteId1' },
      },
      waitUntilComplete: true,
    })
  })

  it('executes correct chained commands when confirm position CTA is clicked and user tries again', async () => {
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() =>
        Promise.resolve({ data: { result: { position: mockStartPosition } } })
      )
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
          },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() => Promise.resolve({} as CommandData))
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
          },
        },
        waitUntilComplete: true,
      })
      .mockImplementationOnce(() => Promise.resolve({} as CommandData))
    const { getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: '1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })

    getByRole('button', { name: 'forward' }).click()
    expect(props.handleJog).toHaveBeenCalled()
    await getByRole('button', { name: 'Confirm position' }).click()
    await expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'savePosition',
        params: { pipetteId: 'pipetteId1' },
      },
      waitUntilComplete: true,
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: '1' },
      position: { x: 10, y: 20, z: 30 },
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(2, {
      type: 'tipPickUpOffset',
      offset: { x: 9, y: 18, z: 27 },
    })
    await expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'pickUpTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
        },
      },
      waitUntilComplete: true,
    })
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    getByRole('button', { name: 'try again' }).click()
    await expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'dropTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
        },
      },
      waitUntilComplete: true,
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(3, {
      type: 'tipPickUpOffset',
      offset: null,
    })
  })
  it('proceeds after confirm position and pick up tip', async () => {
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() =>
        Promise.resolve({ data: { result: { position: mockStartPosition } } })
      )
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
          },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() => Promise.resolve({} as CommandData))
    when(mockCreateRunCommand)
      .calledWith({
        command: {
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
          },
        },
        waitUntilComplete: true,
      })
      .mockImplementation(() => Promise.resolve({} as CommandData))
    const { getByRole } = render({
      ...props,
      workingOffsets: [
        {
          location: { slotName: '1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    })

    await getByRole('button', { name: 'Confirm position' }).click()

    await expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'savePosition',
        params: { pipetteId: 'pipetteId1' },
      },
      waitUntilComplete: true,
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: '1' },
      position: { x: 10, y: 20, z: 30 },
    })
    await expect(props.registerPosition).toHaveBeenNthCalledWith(2, {
      type: 'tipPickUpOffset',
      offset: { x: 9, y: 18, z: 27 },
    })
    await expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'pickUpTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 9, y: 18, z: 27 } },
        },
      },
      waitUntilComplete: true,
    })
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    await getByRole('button', { name: 'yes' }).click()

    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
      1,
      [
        {
          commandType: 'moveLabware',
          params: {
            labwareId: 'labwareId1',
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'fixedTrash',
            wellName: 'A1',
            wellLocation: { origin: 'top' },
          },
        },
      ],
      true
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
            location: { slotName: '3' },
            serialNumber: 'firstHSSerial',
          },
          {
            id: 'secondHSId',
            model: HEATERSHAKER_MODULE_V1,
            location: { slotName: '10' },
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
            newLocation: { slotName: '1' },
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
      ],
      true
    )
  })
})
