// @flow
import type { DeckSlotId, ModuleModel } from '@opentrons/shared-data'
import type {
  ProtocolFile as V3ProtocolFile,
  AspDispAirgapParams,
  BlowoutParams,
  TouchTipParams,
  PipetteAccessParams,
  MoveToSlotParams,
  DelayParams,
} from './schemaV3'
export type { BlowoutParams, FilePipette, FileLabware } from './schemaV3'

export type FileModule = {|
  slot: DeckSlotId,
  model: ModuleModel,
|}

export type EngageMagnetParams = {|
  module: string,
  engageHeight: number,
|}

export type TemperatureParams = {| module: string, temperature: number |}

export type AtomicProfileStep = {| holdTime: number, temperature: number |}
export type TCProfileParams = {|
  module: string,
  profile: Array<AtomicProfileStep>,
  volume: number,
|}

export type ModuleOnlyParams = {| module: string |}

export type ThermocyclerSetTargetBlockTemperatureArgs = {|
  module: string,
  temperature: number,
  volume?: number,
|}

export type Command =
  | {|
      command: 'aspirate' | 'dispense' | 'airGap',
      params: AspDispAirgapParams,
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
      params: ThermocyclerSetTargetBlockTemperatureArgs,
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
      params: TCProfileParams,
    |}
  | {| command: 'thermocycler/awaitProfileComplete', params: ModuleOnlyParams |}

// NOTE: must be kept in sync with '../schemas/4.json'
export type ProtocolFile<DesignerApplicationData> = {|
  ...V3ProtocolFile<DesignerApplicationData>,
  $otSharedSchema: '#/protocol/schemas/4',
  schemaVersion: 4,
  modules: {
    [moduleId: string]: FileModule,
  },
  commands: Array<Command>,
|}
