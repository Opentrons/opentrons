// @flow
import type { DeckSlotId } from '@opentrons/shared-data'
import type {
  ProtocolFile as V3ProtocolFile,
  _AspDispAirgapParams,
  BlowoutParams,
  TouchTipParams,
  PipetteAccessParams,
  MoveToSlotParams,
  DelayParams,
} from './schemaV3'
export type { BlowoutParams, FilePipette, FileLabware } from './schemaV3'

export type FileModule = {|
  slot: DeckSlotId,
  moduleType: string, // see spec for enum
  model: string,
|}

export type EngageMagnetParams = {|
  module: string,
  engageHeight: number,
|}

export type TemperatureParams = {| module: string, temperature: number |}

export type ModuleOnlyParams = {| module: string |}

export type Command =
  | {|
      command: 'aspirate' | 'dispense' | 'airGap',
      params: _AspDispAirgapParams,
    |}
  | {|
      command: 'blowout',
      params: BlowoutParams,
    |}
  | {|
      command: 'touchTip',
      params: TouchTipParams,
    |}
  | {|
      command: 'pickUpTip' | 'dropTip',
      params: PipetteAccessParams,
    |}
  | {|
      command: 'moveToSlot',
      params: MoveToSlotParams,
    |}
  | {|
      command: 'delay',
      params: DelayParams,
    |}
  | {| command: 'magneticModule/engageMagnet', params: EngageMagnetParams |}
  | {|
      command: 'magneticModule/disengageMagnet',
      params: ModuleOnlyParams,
    |}
  | {|
      command: 'temperatureModule/setTargetTemperature',
      params: TemperatureParams,
    |}
  | {| command: 'temperatureModule/deactivate', params: ModuleOnlyParams |}
  | {|
      command: 'temperatureModule/awaitTemperature',
      params: TemperatureParams,
    |}
  | {|
      command: 'thermocycler/setTargetBlockTemperature',
      params: TemperatureParams,
    |}
  | {|
      command: 'thermocycler/setTargetLidTemperature',
      params: TemperatureParams,
    |}
  | {|
      command: 'thermocycler/awaitBlockTemperature',
      params: TemperatureParams,
    |}
  | {|
      command: 'thermocycler/awaitLidTemperature',
      params: TemperatureParams,
    |}
  | {| command: 'thermocycler/openLid', params: ModuleOnlyParams |}
  | {| command: 'thermocycler/closeLid', params: ModuleOnlyParams |}
  | {| command: 'thermocycler/deactivateBlock', params: ModuleOnlyParams |}
  | {| command: 'thermocycler/deactivateLid', params: ModuleOnlyParams |}
  | {|
      command: 'thermocycler/runProfile',
      params: {|
        module: string,
        profile: Array<{| temperature: number, holdTime: number |}>,
      |},
    |}
  | {| command: 'thermocycler/awaitProfileComplete', params: ModuleOnlyParams |}

// NOTE: must be kept in sync with '../schemas/4.json'
export type ProtocolFile<DesignerApplicationData> = {|
  ...V3ProtocolFile<DesignerApplicationData>,
  schemaVersion: 4,
  // TODO: Ian 2019-11-11 make modules a required key when PD drops support for v3
  modules?: {
    [moduleId: string]: FileModule,
  },
  commands: Array<Command>,
|}
