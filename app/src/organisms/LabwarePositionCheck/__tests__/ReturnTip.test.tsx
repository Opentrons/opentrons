import * as React from 'react'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ReturnTip } from '../ReturnTip'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis } from '../__fixtures__'
import { chainRunCommands } from '../utils/chainRunCommands'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'

jest.mock('../utils/chainRunCommands')

const mockChainRunCommands = chainRunCommands as jest.Mock<typeof chainRunCommands>

const matchTextWithSpans: (text: string) => MatcherFunction = (text: string) => (_content, node) => {
  const nodeHasText = node?.textContent === text
  const childrenDontHaveText = Array.from(node?.children ?? []).every(
    (child) => child?.textContent !== text
  )

  return nodeHasText && childrenDontHaveText;
}

const render = (props: React.ComponentProps<typeof ReturnTip>) => {
  return renderWithProviders(<ReturnTip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ReturnTip', () => {
  let props: React.ComponentProps<typeof ReturnTip>

  beforeEach(() => {
    props = {
      section: SECTIONS.RETURN_TIP,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: '1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      createRunCommand: jest.fn(),
      tipPickUpOffset: null,
      isRobotMoving: false,
    }
    mockChainRunCommands.mockImplementation((
      commands,
      createRunCommand,
      onAllSuccess,
    ) => {
      return commands.forEach((c: any) => {
        createRunCommand(
          {
            command: c,
            waitUntilComplete: true,
          }
        )
        onAllSuccess()
      })
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('renders correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Prepare tip rack in slot 1' })
    getByText('Clear all deck slots of labware')
    getByText(matchTextWithSpans('Place Mock TipRack Definition with tip removed into slot 1'))
    getByRole('link', { name: 'Need help?' })
  })
  it('executes correct chained commands when CTA is clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: { slotName: '1' } },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command:
      {
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
    expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'dropTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: undefined },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(4, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: 'offDeck' },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(5, {
      command: { commandType: 'home', params: {} },
      waitUntilComplete: true,
    })
    expect(props.proceed).toHaveBeenCalled()
  })
  it('executes correct chained commands with tip pick up offset when CTA is clicked', () => {
    props = {
      ...props,
      tipPickUpOffset: { x: 10, y: 11, z: 12 }
    }
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(props.createRunCommand).toHaveBeenNthCalledWith(1, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: { slotName: '1' } },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(2, {
      command:
      {
        commandType: 'moveToWell',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'dropTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(4, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: 'offDeck' },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(5, {
      command: { commandType: 'home', params: {} },
      waitUntilComplete: true,
    })
    expect(props.proceed).toHaveBeenCalled()
  })
  it('executes heater shaker closed latch commands for every hs module before other commands', () => {
    props = {
      ...props,
      tipPickUpOffset: { x: 10, y: 11, z: 12 },
      protocolData: {
        ...props.protocolData,
        modules: [{
          id: 'firstHSId',
          model: HEATERSHAKER_MODULE_V1,
          location: { slotName: '3' },
          serialNumber: 'firstHSSerial',
        }, {
          id: 'secondHSId',
          model: HEATERSHAKER_MODULE_V1,
          location: { slotName: '10' },
          serialNumber: 'secondHSSerial',
        }
        ]
      }
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
    expect(props.createRunCommand).toHaveBeenNthCalledWith(3, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: { slotName: '1' } },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(4, {
      command:
      {
        commandType: 'moveToWell',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(5, {
      command: {
        commandType: 'dropTip',
        params: {
          pipetteId: 'pipetteId1',
          labwareId: 'labwareId1',
          wellName: 'A1',
          wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
        },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(6, {
      command: {
        commandType: 'moveLabware',
        params: { labwareId: 'labwareId1', newLocation: 'offDeck' },
      },
      waitUntilComplete: true,
    })
    expect(props.createRunCommand).toHaveBeenNthCalledWith(7, {
      command: { commandType: 'home', params: {} },
      waitUntilComplete: true,
    })
    expect(props.proceed).toHaveBeenCalled()
  })
})
