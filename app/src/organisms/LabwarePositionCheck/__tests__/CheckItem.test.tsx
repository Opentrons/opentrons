import * as React from 'react'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CheckItem } from '../CheckItem'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis, mockExistingOffsets } from '../__fixtures__'
import { chainRunCommands } from '../utils/chainRunCommands'
import {
  HEATERSHAKER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
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

const render = (props: React.ComponentProps<typeof CheckItem>) => {
  return renderWithProviders(<CheckItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CheckItem', () => {
  let props: React.ComponentProps<typeof CheckItem>
  const mockCreateRunCommand = jest.fn()

  beforeEach(() => {
    props = {
      section: SECTIONS.CHECK_LABWARE,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: '1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      createRunCommand: mockCreateRunCommand,
      handleJog: jest.fn(),
      registerPosition: jest.fn(),
      workingOffsets: [],
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
        return onAllSuccess && onAllSuccess()
      }
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('renders correct copy when preparing space with tip rack', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare tip rack in slot 1' })
    getByText('Clear all deck slots of labware')
    getByText(
      matchTextWithSpans('Place a full Mock TipRack Definition into slot 1')
    )
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('renders correct copy when preparing space with non tip rack labware', () => {
    props = {
      ...props,
      labwareId: mockCompletedAnalysis.labware[1].id,
      location: { slotName: '2' },
    }

    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare labware in slot 2' })
    getByText('Clear all deck slots of labware')
    getByText(matchTextWithSpans('Place a Mock Labware Definition into slot 2'))
    getByRole('link', { name: 'Need help?' })
    getByRole('button', { name: 'Confirm placement' })
  })
  it('executes correct chained commands when confirm placement CTA is clicked then go back', () => {
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
          strategy: 'manualMoveWithoutPause',
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
    expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'initialPosition',
      labwareId: 'labwareId1',
      location: { slotName: '1' },
      position: mockStartPosition,
    })
  })
  it('executes correct chained commands when go back clicked', () => {
    props = {
      ...props,
      workingOffsets: [
        {
          location: { slotName: '1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    }
    const { getByRole } = render(props)
    getByRole('button', { name: 'Go back' }).click()

    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: { commandType: 'home', params: {} },
      waitUntilComplete: true,
    })
    expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'initialPosition',
      labwareId: 'labwareId1',
      location: { slotName: '1' },
      position: null,
    })
  })
  it('executes correct chained commands when confirm position clicked', () => {
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
              result: { position: mockEndPosition },
            },
          })
        return Promise.resolve({} as CommandData)
      })
    props = {
      ...props,
      workingOffsets: [
        {
          location: { slotName: '1' },
          labwareId: 'labwareId1',
          initialPosition: { x: 1, y: 2, z: 3 },
          finalPosition: null,
        },
      ],
    }
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm position' }).click()

    expect(props.createRunCommand).toHaveBeenNthCalledWith(
      1,
      {
        command: {
          commandType: 'savePosition',
          params: { pipetteId: 'pipetteId1' },
        },
        waitUntilComplete: true,
      },
      { onSuccess: expect.any(Function) }
    )
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'moveToWell',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'fixedTrash',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: undefined },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'moveLabware',
        params: {
          labwareId: 'labwareId1',
          newLocation: 'offDeck',
          strategy: 'manualMoveWithoutPause',
        },
      },
      waitUntilComplete: true,
    })
    expect(props.registerPosition).toHaveBeenNthCalledWith(1, {
      type: 'finalPosition',
      labwareId: 'labwareId1',
      location: { slotName: '1' },
      position: mockEndPosition,
    })
  })

  it('executes heater shaker open latch command on mount if step is on HS', () => {
    props = {
      ...props,
      location: { slotName: '1', moduleModel: HEATERSHAKER_MODULE_V1 },
      moduleId: 'firstHSId',
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
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'heaterShaker/deactivateShaker',
        params: { moduleId: 'firstHSId' },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command: {
        commandType: 'heaterShaker/openLabwareLatch',
        params: { moduleId: 'firstHSId' },
      },
      waitUntilComplete: true,
    })
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'moveLabware',
        params: {
          labwareId: 'labwareId1',
          newLocation: { moduleId: 'firstHSId' },
          strategy: 'manualMoveWithoutPause',
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(4, {
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId: 'firstHSId' },
      },
      waitUntilComplete: true,
    })

    expect(props.createRunCommand).toHaveBeenNthCalledWith(5, {
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
  })

  it('executes thermocycler open lid command on mount if checking labware on thermocycler', () => {
    props = {
      ...props,
      location: { slotName: '7', moduleModel: THERMOCYCLER_MODULE_V2 },
      moduleId: 'tcId',
      protocolData: {
        ...props.protocolData,
        modules: [
          {
            id: 'tcId',
            model: THERMOCYCLER_MODULE_V2,
            location: { slotName: '7' },
            serialNumber: 'tcSerial',
          },
        ],
      },
    }
    render(props)
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'thermocycler/openLid',
        params: { moduleId: 'tcId' },
      },
      waitUntilComplete: true,
    })
  })
})
