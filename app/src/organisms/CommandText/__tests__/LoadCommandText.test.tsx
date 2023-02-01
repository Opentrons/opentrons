import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LoadCommandText } from '../LoadCommandText'
import { mockRobotSideAnalysis } from '../__fixtures__'
import { LoadLabwareRunTimeCommand, LoadLiquidRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

describe('LoadCommandText', () => {
  it('renders correct text for loadPipette', () => {
    const command = mockRobotSideAnalysis.commands.find(c => c.commandType === 'loadPipette')
    expect(command).not.toBeNull()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <LoadCommandText robotSideAnalysis={mockRobotSideAnalysis} command={command} />,
        { i18nInstance: i18n }
      )[0]
      getByText('Load P300 Single-Channel GEN1 in Left Mount')
    }
  })
  it('renders correct text for loadModule', () => {
    const command = mockRobotSideAnalysis.commands.find(c => c.commandType === 'loadModule')
    expect(command).not.toBeNull()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <LoadCommandText robotSideAnalysis={mockRobotSideAnalysis} command={command} />,
        { i18nInstance: i18n }
      )[0]
      getByText('Load Magnetic Module GEN2 in Slot 1')
    }
  })
  it('renders correct text for loadLabware in slot', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(c => c.commandType === 'loadLabware')
    const loadTipRackCommand = loadLabwareCommands[1]
    const { getByText } = renderWithProviders(
      <LoadCommandText robotSideAnalysis={mockRobotSideAnalysis} command={loadTipRackCommand} />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load Opentrons 96 Tip Rack 300 µL in Slot 9')
  })
  it('renders correct text for loadLabware in module', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(c => c.commandType === 'loadLabware')
    const loadOnModuleCommand = loadLabwareCommands[2]
    const { getByText } = renderWithProviders(
      <LoadCommandText robotSideAnalysis={mockRobotSideAnalysis} command={loadOnModuleCommand} />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load NEST 96 Well Plate 100 µL PCR Full Skirt in Magnetic Module GEN2 in Slot 1')
  })
  it('renders correct text for loadLabware off deck', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(c => c.commandType === 'loadLabware')
    const loadOffDeckCommand = {
      ...loadLabwareCommands[3],
      params: {
        ...loadLabwareCommands[3].params,
        location: 'offDeck',
      }
    } as LoadLabwareRunTimeCommand
    const { getByText } = renderWithProviders(
      <LoadCommandText robotSideAnalysis={mockRobotSideAnalysis} command={loadOffDeckCommand} />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load NEST 96 Well Plate 100 µL PCR Full Skirt off deck')
  })
  it('renders correct text for loadLiquid', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(c => c.commandType === 'loadLabware')
    const liquidId = 'zxcvbn'
    const labwareId = 'uytrew'
    const loadLiquidCommand = {
      ...loadLabwareCommands[0],
      commandType: 'loadLiquid',
      params: { liquidId, labwareId }
    } as LoadLiquidRunTimeCommand
    const analysisWithLiquids = {
      ...mockRobotSideAnalysis,
      liquids: [
        {
          id: 'zxcvbn',
          displayName: 'Water',
          description: 'wet',
          displayColor: '#0000ff'
        }
      ],
      labware: [
        {
          id: labwareId,
          loadName: 'fake_loadname',
          definitionUri: 'fake_uri',
          location: 'offDeck' as const,
          displayName: 'fakeDisplayName'
        }
      ]
    }
    const { getByText } = renderWithProviders(
      <LoadCommandText robotSideAnalysis={analysisWithLiquids} command={loadLiquidCommand} />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load Water into fakeDisplayName')
  })
})

