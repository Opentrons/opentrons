# Quick Transfer Versioning:

Quick Transfer is versioned under the `designerApplicationData` field on the resulting protocol file. Since this data is not yet read or migrated this doc details the versions, type of `quickTransferState` per version, and other changes made so that migration can occur in the future if needed.

## Version 1.0.0

```
export interface QuickTransferSummaryState {
  pipette: PipetteV2Specs
  mount: Mount
  tipRack: LabwareDefinition2
  source: LabwareDefinition2
  sourceWells: string[]
  destination: LabwareDefinition2 | 'source'
  destinationWells: string[]
  transferType: TransferType
  volume: number
  aspirateFlowRate: number
  dispenseFlowRate: number
  path: PathOption
  tipPositionAspirate: number
  preWetTip: boolean
  mixOnAspirate?: {
    mixVolume: number
    repetitions: number
  }
  delayAspirate?: {
    delayDuration: number
    positionFromBottom: number
  }
  touchTipAspirate?: number
  airGapAspirate?: number
  tipPositionDispense: number
  mixOnDispense?: {
    mixVolume: number
    repetitions: number
  }
  delayDispense?: {
    delayDuration: number
    positionFromBottom: number
  }
  touchTipDispense?: number
  disposalVolume?: number
  blowOut?: BlowOutLocation
  airGapDispense?: number
  changeTip: ChangeTipOptions
  dropTipLocation: CutoutConfig
}
```

## Version 1.1.0

Type is the same as in `1.0.0`, but the number represented by `touchTipAspirate` and `touchTipDispense` is now the distance from the top of the well instead of distance from the bottom of the well. This can be migrated using the well height from the definition on both source and dest labware.

```
touchTipAspirate = -(sourceWellHeight - prevTouchTipAspirate)
touchTipDispense = -(destWellHeight - prevTouchTipDispense)
```

## Version 1.2.0

Due to changes in the Quick Transfer setup flow, there will be changes to QuickTransferWizardState and QuickTransferSummaryState. The changes are as follows:
the comment `this has been added` will be removed before feature freeze.

Now using command schema 14

```ts
export interface QuickTransferWizardState {
  pipette?: PipetteV2Specs
  mount?: Mount
  tipRack?: LabwareDefinition2
  source?: LabwareDefinition2
  sourceWells?: string[]
  destination?: LabwareDefinition2 | 'source'
  destinationWells?: string[]
  transferType?: TransferType
  volume?: number
  path?: PathOption // from version 1.2.0
  changeTip?: ChangeTipOptions // from version 1.2.0
  dropTipLocation?: CutoutConfig // from version 1.2.0
  liquidClassName?: string // from version 1.2.0
}
```

```ts
export interface QuickTransferSummaryState {
  pipette: PipetteV2Specs
  mount: Mount
  tipRack: LabwareDefinition2
  source: LabwareDefinition2
  sourceWells: string[]
  destination: LabwareDefinition2 | 'source'
  destinationWells: string[]
  transferType: TransferType
  volume: number
  aspirateFlowRate: number
  dispenseFlowRate: number
  path: PathOption
  tipPositionAspirate: number
  preWetTip: boolean
  pushOutDispense?: {
    // from version 1.2.0
    volume: number
  }
  mixOnAspirate?: {
    mixVolume: number
    repetitions: number
  }
  submergeAspirate?: {
    // from version 1.2.0
    speed: number
    delayDuration: number
    position: number
    positionReference: PositionReference
  }
  retractAspirate?: {
    // from version 1.2.0
    speed: number
    delayDuration: number
    position: number
    positionReference: PositionReference
  }
  delayAspirate?: {
    // updated in version 1.2.0
    delayDuration: number
  }
  touchTipAspirate?: number
  touchTipAspirateSpeed?: number
  airGapAspirate?: number
  tipPositionDispense: number
  mixOnDispense?: {
    mixVolume: number
    repetitions: number
  }
  submergeDispense?: {
    // from version 1.2.0
    speed: number
    delayDuration: number
    position: number
    positionReference: PositionReference
  }
  retractDispense?: {
    // from version 1.2.0
    speed: number
    delayDuration: number
    position: number
    positionReference: PositionReference
  }
  delayDispense?: {
    // updated in version 1.2.0
    delayDuration: number
  }
  touchTipDispense?: number
  touchTipDispenseSpeed?: number
  disposalVolume?: number
  blowOutDispense?: {
    // updated in version 1.2.0
    location?: BlowOutLocation
    flowRate?: number
  }
  airGapDispense?: number
  changeTip: ChangeTipOptions
  dropTipLocation: CutoutConfig
  liquidClassName: string // from version 1.2.0
  conditionAspirate?: number // from version 1.2.0
  disposalVolumeDispenseSettings?: {
    // from version 1.2.0
    volume: number
    blowOutLocation: BlowOutLocation
    flowRate: number
  }
  liquidClassValuesInitialized: boolean // from version 1.2.0
}
```

## Version 2.0.0

Introduction of Python protocol generation starting in robot stack v8.7.0.

The shape of the Python file is as follows:

```ts
imports
metadata
requirements
commands
```

Note that the `designerApplicationData` is not included in the generated Python, therefore, cloning/editing the generated protocol is currently not possible (which is never has been).

You can still generate JSON behind a feature flag.

## Version 2.1.0

Introduction of return tip in robot stack v8.8.0, mirroring return tip support introducted in Protocol Designer 8.6.0: Return an attached pipette tip to the tip rack after aspirating, dispensing, or mixing.

## Version 2.1.1

Note that this might still change and adding it here so we don't forget. The ability to generate JSON behind a feature flag has been deprecated.