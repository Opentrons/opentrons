import * as React from 'react'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { PickUpTip } from '../PickUpTip'
import { SECTIONS } from '../constants'
import {
  mockCompletedAnalysis,
  mockExistingOffsets,
  mockWorkingOffsets,
} from '../__fixtures__'
import { chainRunCommands } from '../utils/chainRunCommands'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'
import { CommandData } from '@opentrons/api-client'
import { resetAllWhenMocks, when } from 'jest-when'

jest.mock('../utils/chainRunCommands')

const mockStartPosition = { x: 10, y: 20, z: 30 }
const mockEndPosition = { x: 9, y: 19, z: 29 }
const mockChainRunCommands = chainRunCommands as jest.Mock<
  typeof chainRunCommands
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
  const mockCreateRunCommand = jest.fn()

  beforeEach(() => {
    props = {
      section: SECTIONS.PICK_UP_TIP,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: '1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      createRunCommand: mockCreateRunCommand,
      handleJog: jest.fn(),
      registerPosition: jest.fn(),
      workingOffsets: mockWorkingOffsets,
      existingOffsets: mockExistingOffsets,
      isRobotMoving: false,
    }
    mockChainRunCommands.mockImplementation(
      (commands, createRunCommand, onAllSuccess) => {
        commands.forEach((c: any) => {
          createRunCommand({
            command: c,
            waitUntilComplete: true,
          })
        })
        return onAllSuccess()
      }
    )
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
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementation((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockStartPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    const { getByText, getByRole } = render(props)
    getByRole('button', { name: 'Confirm placement' }).click()
    getByRole('heading', { name: 'Pick up tip from tip rack in slot 1' })
    getByText(
      "Ensure that the pipette nozzle closest to you is centered above and level with the top of the tip in the A1 position. If it isn't, use the controls below or your keyboard to jog the pipette until it is properly aligned"
    )
    getByRole('link', { name: 'Need help?' })
  })
  it('executes correct chained commands when confirm placement CTA is clicked', () => {
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementation((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockStartPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'moveLabware',
        params: {
          labwareId: 'labwareId1',
          newLocation: { slotName: '1' },
          strategy: 'manualMoveWithoutPause'
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'moveToWell',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: undefined },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      3,
      {
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
  })

  it('executes correct chained commands when confirm position CTA is clicked and user tries again', () => {
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementationOnce((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockStartPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementationOnce((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockEndPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementationOnce((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockStartPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'savePosition',
            params: { pipetteId: 'pipetteId1' },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementationOnce((_c, opts) => {
        opts != null &&
          (opts?.onSuccess as any)({
            data: {
              result: { position: mockEndPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    when(mockCreateRunCommand)
      .calledWith(
        {
          command: {
            commandType: 'pickUpTip',
            params: {
              pipetteId: 'pipetteId1',
              labwareId: 'labwareId1',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: -1, y: -1, z: -1 } },
            },
          },
          waitUntilComplete: true,
        },
        { onSuccess: expect.any(Function) }
      )
      .mockImplementation((_c, opts) => {
        opts != null && (opts?.onSuccess as any)()
        return Promise.resolve({} as CommandData)
      })
    when(mockCreateRunCommand)
      .calledWith(
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
        { onSuccess: expect.any(Function) }
      )
      .mockImplementation((_c, opts) => {
        opts != null && (opts?.onSuccess as any)()
        return Promise.resolve({} as CommandData)
      })
    const { getByRole } = render(props)

    getByRole('button', { name: 'Confirm placement' }).click()
    getByRole('button', { name: 'forward' }).click()
    expect(props.handleJog).toHaveBeenCalled()
    getByRole('button', { name: 'Confirm position' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      4,
      {
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
    expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'tipPickUpOffset',
      offset: { x: -1, y: -1, z: -1 },
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      5,
      {
        command: {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: -1, y: -1, z: -1 } },
          },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    getByRole('button', { name: 'try again' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      6,
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
      { onSuccess: expect.any(Function) }
    )
    expect(props.registerPosition).toHaveBeenNthCalledWith(2, {
      type: 'tipPickUpOffset',
      offset: null,
    })

    getByRole('button', { name: 'Confirm placement' }).click()
    getByRole('button', { name: 'left' }).click()
    expect(props.handleJog).toHaveBeenCalled()
    getByRole('button', { name: 'Confirm position' }).click()

    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      10,
      {
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
    expect(props.registerPosition).toHaveBeenNthCalledWith(3, {
      type: 'tipPickUpOffset',
      offset: { x: -1, y: -1, z: -1 },
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      11,
      {
        command: {
          commandType: 'pickUpTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: { x: -1, y: -1, z: -1 } },
          },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
    getByRole('heading', { name: 'Did pipette pick up tip successfully?' })
    getByRole('button', { name: 'yes' }).click()

    expect(props.createRunCommand).toHaveBeenNthCalledWith(12, {
      command: {
        commandType: 'moveLabware',
        params: {
          labwareId: 'labwareId1',
          newLocation: 'offDeck',
          strategy: 'manualMoveWithoutPause'
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(13, {
      command: {
        commandType: 'moveToWell',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'fixedTrash',
          wellName: 'A1',
          wellLocation: { origin: 'top' },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.proceed).toHaveBeenCalled()
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
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId: 'firstHSId' },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId: 'secondHSId' },
      },
      waitUntilComplete: true,
    })
  })
})
