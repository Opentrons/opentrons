import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  AspirateInPlaceRunTimeCommand,
  BlowoutInPlaceRunTimeCommand,
  DispenseInPlaceRunTimeCommand,
  DropTipInPlaceRunTimeCommand,
  FLEX_ROBOT_TYPE,
  MoveToAddressableAreaRunTimeCommand,
  PrepareToAspirateRunTimeCommand,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { CommandText } from '../'
import { mockRobotSideAnalysis } from '../__fixtures__'

import type {
  BlowoutRunTimeCommand,
  ConfigureForVolumeRunTimeCommand,
  DispenseRunTimeCommand,
  DropTipRunTimeCommand,
  LabwareDefinition2,
  LoadLabwareRunTimeCommand,
  LoadLiquidRunTimeCommand,
  MoveToWellRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

describe('CommandText', () => {
  it('renders correct text for aspirate', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'aspirate'
    )
    expect(command).not.toBeUndefined()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText(
        'Aspirating 100 µL from well A1 of NEST 1 Well Reservoir 195 mL in Slot 5 at 150 µL/sec'
      )
    }
  })
  it('renders correct text for dispense without pushOut', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'dispense'
    )
    expect(command).not.toBeUndefined()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText(
        'Dispensing 100 µL into well A1 of NEST 96 Well Plate 100 µL PCR Full Skirt (1) in Magnetic Module GEN2 in Slot 1 at 300 µL/sec'
      )
    }
  })
  it('renders correct text for dispense with pushOut', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'dispense'
    )
    const pushOutDispenseCommand = {
      ...command,
      params: {
        ...command?.params,
        pushOut: 10,
      },
    } as DispenseRunTimeCommand
    expect(pushOutDispenseCommand).not.toBeUndefined()
    if (pushOutDispenseCommand != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={pushOutDispenseCommand}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText(
        'Dispensing 100 µL into well A1 of NEST 96 Well Plate 100 µL PCR Full Skirt (1) in Magnetic Module GEN2 in Slot 1 at 300 µL/sec and pushing out 10 µL'
      )
    }
  })
  it('renders correct text for dispenseInPlace', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'dispenseInPlace',
            params: {
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
              flowRate: 300,
              volume: 50,
            },
          } as DispenseInPlaceRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Dispensing 50 µL in place at 300 µL/sec')
  })
  it('renders correct text for blowout', () => {
    const dispenseCommand = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'dispense'
    )
    const blowoutCommand = {
      ...dispenseCommand,
      commandType: 'blowout',
    } as BlowoutRunTimeCommand
    expect(blowoutCommand).not.toBeUndefined()
    if (blowoutCommand != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={blowoutCommand}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText(
        'Blowing out at well A1 of NEST 96 Well Plate 100 µL PCR Full Skirt (1) in Magnetic Module GEN2 in Slot 1 at 300 µL/sec'
      )
    }
  })
  it('renders correct text for blowOutInPlace', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'blowOutInPlace',
            params: {
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
              flowRate: 300,
            },
          } as BlowoutInPlaceRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Blowing out in place at 300 µL/sec')
  })
  it('renders correct text for aspirateInPlace', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'aspirateInPlace',
            params: {
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
              flowRate: 300,
              volume: 10,
            },
          } as AspirateInPlaceRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Aspirating 10 µL in place at 300 µL/sec')
  })
  it('renders correct text for moveToWell', () => {
    const dispenseCommand = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'aspirate'
    )
    const moveToWellCommand = {
      ...dispenseCommand,
      commandType: 'moveToWell',
    } as MoveToWellRunTimeCommand
    expect(moveToWellCommand).not.toBeUndefined()
    if (moveToWellCommand != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={moveToWellCommand}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText('Moving to well A1 of NEST 1 Well Reservoir 195 mL in Slot 5')
    }
  })
  it('renders correct text for moveToAddressableArea', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'moveToAddressableArea',
            params: {
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
              addressableAreaName: 'D3',
              speed: 200,
              minimumZHeight: 100,
            },
          } as MoveToAddressableAreaRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Moving to D3 at 200 mm/s at 100 mm high')
  })
  it('renders correct text for configureForVolume', () => {
    const command = {
      commandType: 'configureForVolume',
      params: {
        volume: 1,
        pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
      },
    } as ConfigureForVolumeRunTimeCommand

    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={command}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Configure P300 Single-Channel GEN1 to aspirate 1 µL')
  })
  it('renders correct text for prepareToAspirate', () => {
    const command = {
      commandType: 'prepareToAspirate',
      params: {
        pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
      },
    } as PrepareToAspirateRunTimeCommand

    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={command}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Preparing P300 Single-Channel GEN1 to aspirate')
  })
  it('renders correct text for dropTip', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'dropTip'
    )
    expect(command).not.toBeUndefined()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText('Dropping tip in A1 of Fixed Trash')
    }
  })
  it('renders correct text for dropTip into a labware', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'dropTip',
            params: {
              labwareId: 'b2a40c9d-31b0-4f27-ad4a-c92ced91204d',
              wellName: 'A1',
              wellLocation: { origin: 'top', offset: { x: 0, y: 0, z: 0 } },
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
            },
          } as DropTipRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Returning tip to A1 of Opentrons 96 Tip Rack 300 µL in Slot 9')
  })
  it('renders correct text for dropTipInPlace', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={
          {
            commandType: 'dropTipInPlace',
            params: {
              pipetteId: 'f6d1c83c-9d1b-4d0d-9de3-e6d649739cfb',
            },
          } as DropTipInPlaceRunTimeCommand
        }
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Dropping tip in place')
  })
  it('renders correct text for pickUpTip', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'pickUpTip'
    )
    expect(command).not.toBeUndefined()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText(
        'Picking up tip(s) from A1 of Opentrons 96 Tip Rack 300 µL in Slot 9'
      )
    }
  })
  it('renders correct text for loadPipette', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'loadPipette'
    )
    expect(command).not.toBeNull()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText('Load P300 Single-Channel GEN1 in Left Mount')
    }
  })
  it('renders correct text for loadModule', () => {
    const command = mockRobotSideAnalysis.commands.find(
      c => c.commandType === 'loadModule'
    )
    expect(command).not.toBeNull()
    if (command != null) {
      const { getByText } = renderWithProviders(
        <CommandText
          robotSideAnalysis={mockRobotSideAnalysis}
          robotType={FLEX_ROBOT_TYPE}
          command={command}
        />,
        { i18nInstance: i18n }
      )[0]
      getByText('Load Magnetic Module GEN2 in Slot 1')
    }
  })
  it('renders correct text for loadLabware that is category adapter in slot', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(
      c => c.commandType === 'loadLabware'
    )
    const loadLabwareCommand = loadLabwareCommands[0]
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={loadLabwareCommand}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load Opentrons 96 Flat Bottom Adapter in Slot 2')
  })
  it('renders correct text for loadLabware in slot', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(
      c => c.commandType === 'loadLabware'
    )
    const loadTipRackCommand = loadLabwareCommands[2]
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={loadTipRackCommand}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load Opentrons 96 Tip Rack 300 µL in Slot 9')
  })
  it('renders correct text for loadLabware in module', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(
      c => c.commandType === 'loadLabware'
    )
    const loadOnModuleCommand = loadLabwareCommands[3]
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={loadOnModuleCommand}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText(
      'Load NEST 96 Well Plate 100 µL PCR Full Skirt in Magnetic Module GEN2 in Slot 1'
    )
  })
  it('renders correct text for loadLabware in adapter', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'loadLabware',
          params: {
            version: 1,
            namespace: 'opentrons',
            loadName: 'labwareMock',
            location: {
              labwareId:
                '29444782-bdc8-4ad8-92fe-5e28872e85e5:opentrons/opentrons_96_flat_bottom_adapter/1',
            },
          },
          id: 'def456',
          result: {
            labwareId: 'mockId',
            definition: {
              metadata: { displayName: 'mock displayName' },
            } as LabwareDefinition2,
            offset: { x: 0, y: 0, z: 0 },
          },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Load mock displayName in Opentrons 96 Flat Bottom Adapter in Slot 2'
    )
  })
  it('renders correct text for loadLabware off deck', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(
      c => c.commandType === 'loadLabware'
    )
    const loadOffDeckCommand = {
      ...loadLabwareCommands[4],
      params: {
        ...loadLabwareCommands[4].params,
        location: 'offDeck',
      },
    } as LoadLabwareRunTimeCommand
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
        command={loadOffDeckCommand}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load NEST 96 Well Plate 100 µL PCR Full Skirt off deck')
  })
  it('renders correct text for loadLiquid', () => {
    const loadLabwareCommands = mockRobotSideAnalysis.commands.filter(
      c => c.commandType === 'loadLabware'
    )
    const liquidId = 'zxcvbn'
    const labwareId = 'uytrew'
    const loadLiquidCommand = {
      ...loadLabwareCommands[1],
      commandType: 'loadLiquid',
      params: { liquidId, labwareId },
    } as LoadLiquidRunTimeCommand
    const analysisWithLiquids = {
      ...mockRobotSideAnalysis,
      liquids: [
        {
          id: 'zxcvbn',
          displayName: 'Water',
          description: 'wet',
          displayColor: '#0000ff',
        },
      ],
      labware: [
        {
          id: labwareId,
          loadName: 'fake_loadname',
          definitionUri: 'fake_uri',
          location: 'offDeck' as const,
          displayName: 'fakeDisplayName',
        },
      ],
    }
    const { getByText } = renderWithProviders(
      <CommandText
        robotSideAnalysis={analysisWithLiquids}
        robotType={FLEX_ROBOT_TYPE}
        command={loadLiquidCommand}
      />,
      { i18nInstance: i18n }
    )[0]
    getByText('Load Water into fakeDisplayName')
  })
  it('renders correct text for temperatureModule/setTargetTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'temperatureModule/setTargetTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Setting Temperature Module to 20°C (rounded to nearest integer)')
  })
  it('renders correct text for temperatureModule/waitForTemperature with target temp', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'temperatureModule/waitForTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Waiting for Temperature Module to reach 20°C')
  })
  it('renders correct text for temperatureModule/waitForTemperature with no specified temp', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'temperatureModule/waitForTemperature',
          params: { moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Waiting for Temperature Module to reach target temperature')
  })
  it('renders correct text for thermocycler/setTargetBlockTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'thermocycler/setTargetBlockTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Setting Thermocycler block temperature to 20°C with hold time of 0 seconds after target reached'
    )
  })
  it('renders correct text for thermocycler/setTargetLidTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'thermocycler/setTargetLidTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Setting Thermocycler lid temperature to 20°C')
  })
  it('renders correct text for heaterShaker/setTargetTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'heaterShaker/setTargetTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Setting Target Temperature of Heater-Shaker to 20°C')
  })
  it('renders correct text for thermocycler/runProfile', () => {
    const mockProfileSteps = [
      { holdSeconds: 10, celsius: 20 },
      { holdSeconds: 30, celsius: 40 },
    ]
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'thermocycler/runProfile',
          params: { profile: mockProfileSteps, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Thermocycler starting 2 repetitions of cycle composed of the following steps:'
    )
    getByText('temperature: 20°C, seconds: 10')
    getByText('temperature: 40°C, seconds: 30')
  })
  it('renders correct text for heaterShaker/setAndWaitForShakeSpeed', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'heaterShaker/setAndWaitForShakeSpeed',
          params: { rpm: 1000, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Setting Heater-Shaker to shake at 1000 rpm and waiting until reached'
    )
  })
  it('renders correct text for moveToSlot', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveToSlot',
          params: { slotName: '1', pipetteId: 'asdfgh' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Moving to Slot 1')
  })
  it('renders correct text for moveRelative', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveRelative',
          params: { pipetteId: 'asdfgh', axis: 'x', distance: 10 },
          id: 'def456',
          result: { position: { x: 1, y: 2, z: 3 } },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Moving 10 mm along x axis')
  })
  it('renders correct text for moveToCoordinates', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveToCoordinates',
          params: { pipetteId: 'asdfgh', coordinates: { x: 1, y: 2, z: 3 } },
          id: 'def456',
          result: { position: { x: 1, y: 2, z: 3 } },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Moving to (X: 1, Y: 2, Z: 3)')
  })
  it('renders correct text for commands with no parsed params', () => {
    const expectedCopyByCommandType: {
      [commandType in RunTimeCommand['commandType']]?: string
    } = {
      home: 'Homing all gantry, pipette, and plunger axes',
      savePosition: 'Saving position',
      touchTip: 'Touching tip',
      'magneticModule/engage': 'Engaging Magnetic Module',
      'magneticModule/disengage': 'Disengaging Magnetic Module',
      'temperatureModule/deactivate': 'Deactivating Temperature Module',
      'thermocycler/waitForBlockTemperature':
        'Waiting for Thermocycler block to reach target temperature and holding for specified time',
      'thermocycler/waitForLidTemperature':
        'Waiting for Thermocycler lid to reach target temperature',
      'thermocycler/openLid': 'Opening Thermocycler lid',
      'thermocycler/closeLid': 'Closing Thermocycler lid',
      'thermocycler/deactivateBlock': 'Deactivating Thermocycler block',
      'thermocycler/deactivateLid': 'Deactivating Thermocycler lid',
      'thermocycler/awaitProfileComplete':
        'Waiting for Thermocycler profile to complete',
      'heaterShaker/deactivateHeater': 'Deactivating heater',
      'heaterShaker/openLabwareLatch': 'Unlatching labware on Heater-Shaker',
      'heaterShaker/closeLabwareLatch': 'Latching labware on Heater-Shaker',
      'heaterShaker/deactivateShaker': 'Deactivating shaker',
      'heaterShaker/waitForTemperature':
        'Waiting for Heater-Shaker to reach target temperature',
    } as const
    Object.entries(expectedCopyByCommandType).forEach(
      ([commandType, expectedCopy]) => {
        const { getByText } = renderWithProviders(
          <CommandText
            command={
              {
                commandType,
                params: {},
                id: 'def456',
                result: {},
                status: 'queued',
                error: null,
                createdAt: 'fake_timestamp',
                startedAt: null,
                completedAt: null,
              } as RunTimeCommand
            }
            robotSideAnalysis={mockRobotSideAnalysis}
            robotType={FLEX_ROBOT_TYPE}
          />,
          {
            i18nInstance: i18n,
          }
        )[0]
        expect(expectedCopy).not.toBeUndefined()
        if (expectedCopy != null) getByText(expectedCopy)
      }
    )
  })
  it('renders correct text for waitForDuration', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'waitForDuration',
          params: { seconds: 42, message: 'THIS IS A MESSAGE' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Pausing for 42 seconds. THIS IS A MESSAGE')
  })
  it('renders correct text for legacy pause with message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'pause',
          params: { message: 'THIS IS A MESSAGE' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('THIS IS A MESSAGE')
  })
  it('renders correct text for legacy pause without message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'pause',
          params: {},
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Pausing protocol')
  })
  it('renders correct text for waitForResume with message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'waitForResume',
          params: { message: 'THIS IS A MESSAGE' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('THIS IS A MESSAGE')
  })
  it('renders correct text for waitForResume without message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'waitForResume',
          params: {},
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Pausing protocol')
  })
  it('renders correct text for legacy delay with time', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'delay',
          params: { seconds: 42, message: 'THIS IS A MESSAGE' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Pausing for 42 seconds. THIS IS A MESSAGE')
  })
  it('renders correct text for legacy delay wait for resume with message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'delay',
          params: { waitForResume: true, message: 'THIS IS A MESSAGE' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('THIS IS A MESSAGE')
  })
  it('renders correct text for legacy delay wait for resume without message', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'delay',
          params: { waitForResume: true },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('Pausing protocol')
  })
  it('renders correct text for custom command type with legacy command text', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'custom',
          params: { legacyCommandText: 'SOME LEGACY COMMAND' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText('SOME LEGACY COMMAND')
  })
  it('renders correct text for custom command type with arbitrary params', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'custom',
          params: {
            thunderBolts: true,
            lightning: 'yup',
            veryVeryFrightening: 1,
          },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'custom: {"thunderBolts":true,"lightning":"yup","veryVeryFrightening":1}'
    )
  })
  it('renders correct text for move labware manually off deck', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveLabware',
          params: {
            strategy: 'manualMoveWithPause',
            labwareId: mockRobotSideAnalysis.labware[2].id,
            newLocation: 'offDeck',
          },
          id: 'def456',
          result: { offsetId: 'fake_offset_id' },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Manually move Opentrons 96 Tip Rack 300 µL from Slot 9 to off deck'
    )
  })
  it('renders correct text for move labware manually to module', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveLabware',
          params: {
            strategy: 'manualMoveWithPause',
            labwareId: mockRobotSideAnalysis.labware[3].id,
            newLocation: { slotName: 'A3' },
          },
          id: 'def456',
          result: { offsetId: 'fake_offset_id' },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Manually move NEST 96 Well Plate 100 µL PCR Full Skirt (1) from Magnetic Module GEN2 in Slot 1 to Slot A3'
    )
  })
  it('renders correct text for move labware with gripper off deck', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveLabware',
          params: {
            strategy: 'usingGripper',
            labwareId: mockRobotSideAnalysis.labware[2].id,
            newLocation: 'offDeck',
          },
          id: 'def456',
          result: { offsetId: 'fake_offset_id' },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Moving Opentrons 96 Tip Rack 300 µL using gripper from Slot 9 to off deck'
    )
  })
  it('renders correct text for move labware with gripper to module', () => {
    const { getByText } = renderWithProviders(
      <CommandText
        command={{
          commandType: 'moveLabware',
          params: {
            strategy: 'usingGripper',
            labwareId: mockRobotSideAnalysis.labware[3].id,
            newLocation: { moduleId: mockRobotSideAnalysis.modules[0].id },
          },
          id: 'def456',
          result: { offsetId: 'fake_offset_id' },
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
        robotSideAnalysis={mockRobotSideAnalysis}
        robotType={FLEX_ROBOT_TYPE}
      />,
      {
        i18nInstance: i18n,
      }
    )[0]
    getByText(
      'Moving NEST 96 Well Plate 100 µL PCR Full Skirt (1) using gripper from Magnetic Module GEN2 in Slot 1 to Magnetic Module GEN2 in Slot 1'
    )
  })
})
