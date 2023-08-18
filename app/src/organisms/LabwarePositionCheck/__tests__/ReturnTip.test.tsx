import * as React from 'react'
import type { MatcherFunction } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { ReturnTip } from '../ReturnTip'
import { SECTIONS } from '../constants'
import { mockCompletedAnalysis } from '../__fixtures__'
import { useProtocolMetadata } from '../../Devices/hooks'

jest.mock('../../Devices/hooks')

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

const render = (props: React.ComponentProps<typeof ReturnTip>) => {
  return renderWithProviders(<ReturnTip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ReturnTip', () => {
  let props: React.ComponentProps<typeof ReturnTip>
  let mockChainRunCommands

  beforeEach(() => {
    mockChainRunCommands = jest.fn().mockImplementation(() => Promise.resolve())
    props = {
      section: SECTIONS.RETURN_TIP,
      pipetteId: mockCompletedAnalysis.pipettes[0].id,
      labwareId: mockCompletedAnalysis.labware[0].id,
      location: { slotName: 'D1' },
      protocolData: mockCompletedAnalysis,
      proceed: jest.fn(),
      setFatalError: jest.fn(),
      chainRunCommands: mockChainRunCommands,
      tipPickUpOffset: null,
      isRobotMoving: false,
    }
    mockUseProtocolMetaData.mockReturnValue({ robotType: 'OT-3 Standard' })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('renders correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByRole('heading', { name: 'Return tip rack to slot D1' })
    getByText('Clear all deck slots of labware, leaving modules in place')
    getByText(
      matchTextWithSpans(
        'Place the Mock TipRack Definition that you used before back into slot D1. The pipette will return tips to their original location in the rack.'
      )
    )
    getByRole('link', { name: 'Need help?' })
  })
  it('executes correct chained commands when CTA is clicked', async () => {
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
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: { origin: 'top', offset: undefined },
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
        { commandType: 'home', params: {} },
      ],
      false
    )
    await expect(props.proceed).toHaveBeenCalled()
  })
  it('executes correct chained commands with tip pick up offset when CTA is clicked', async () => {
    props = {
      ...props,
      tipPickUpOffset: { x: 10, y: 11, z: 12 },
    }
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
            wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
          },
        },
        {
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 10, y: 11, z: 12 },
            },
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
        { commandType: 'home', params: {} },
      ],
      false
    )
    await expect(props.proceed).toHaveBeenCalled()
  })
  it('executes heater shaker closed latch commands for every hs module before other commands', async () => {
    props = {
      ...props,
      tipPickUpOffset: { x: 10, y: 11, z: 12 },
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
    await getByRole('button', { name: 'Confirm placement' }).click()
    await expect(props.chainRunCommands).toHaveBeenNthCalledWith(
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
            wellLocation: { origin: 'top', offset: { x: 10, y: 11, z: 12 } },
          },
        },
        {
          commandType: 'dropTip',
          params: {
            pipetteId: 'pipetteId1',
            labwareId: 'labwareId1',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 10, y: 11, z: 12 },
            },
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
        { commandType: 'home', params: {} },
      ],
      false
    )
    await expect(props.proceed).toHaveBeenCalled()
  })
})
