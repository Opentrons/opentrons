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

export type TempParams = {| module: string, temperature: number |}

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
      params: TempParams,
    |}
  | {| command: 'temperatureModule/deactivate', params: ModuleOnlyParams |}
  | {|
      command: 'temperatureModule/awaitTemperature',
      params: TempParams,
    |}
  | {|
      command: 'thermocycler/setTargetBlockTemperature',
      params: TempParams,
    |}
  | {|
      command: 'thermocycler/setTargetLidTemperature',
      params: TempParams,
    |}
  | {|
      command: 'thermocycler/awaitBlockTemperature',
      params: TempParams,
    |}
  | {|
      command: 'thermocycler/awaitLidTemperature',
      params: TempParams,
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
