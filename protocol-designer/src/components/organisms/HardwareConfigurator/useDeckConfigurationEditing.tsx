import { useState } from 'react'
import {
  ABSORBANCE_READER_CUTOUTS,
  ABSORBANCE_READER_V1,
  ABSORBANCE_READER_V1_FIXTURE,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  HEATER_SHAKER_CUTOUTS,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
} from '@opentrons/shared-data'

import { AddFixtureModal } from './AddFixtureModal'

import type { FormModules } from '../../../step-forms'
import type { WizardFixtureType, WizardFormState } from '../types'
import type { CutoutConfigExtended, OptionStage } from './AddFixtureModal'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { UseFormSetValue } from 'react-hook-form'

interface DeckConfigurationEditingProps {
  addFixtureToCutout: (cutoutId: CutoutId) => void
  removeFixtureFromCutout: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  addFixtureModal: ReactNode
}
export function useDeckConfigurationEditing(
  deckConfig: DeckConfiguration,
  setUpdatedDeckConfig: Dispatch<SetStateAction<DeckConfiguration>>,
  setValue: UseFormSetValue<WizardFormState>,
  modules: FormModules,
  fixtures: WizardFixtureType,
  hasGripper: boolean
): DeckConfigurationEditingProps {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const [targetCutoutId, setTargetCutoutId] = useState<CutoutId | null>(null)

  const addFixtureToCutout = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
  }

  const removeFixtureFromCutout = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ): void => {
    const thermocyclerCutoutFixtureId =
      cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
      cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE
    const tcCutouts = ['cutoutA1', 'cutoutB1']
    //  remove any fixtures from that cutoutId
    if (
      Object.values(fixtures).some(fixture => fixture.cutoutId === cutoutId)
    ) {
      const filteredFixtures = Object.fromEntries(
        Object.entries(fixtures).filter(
          ([_, fixture]) => fixture.cutoutId !== cutoutId
        )
      )
      setValue('fixtures', filteredFixtures)
    }
    //  remove any modules from that cutoutId
    if (
      Object.values(modules).some(
        module =>
          module.cutoutId === cutoutId ||
          //  special-casing for thermocycler since deck config adds to both cutouts
          (thermocyclerCutoutFixtureId &&
            tcCutouts.includes(module.cutoutId ?? 'cutoutA1'))
      )
    ) {
      const fixturedModules = Object.fromEntries(
        Object.entries(modules).filter(([_, module]) =>
          thermocyclerCutoutFixtureId
            ? !tcCutouts.includes(module.cutoutId ?? 'cutoutA1')
            : module.cutoutId !== cutoutId
        )
      )
      setValue('modules', fixturedModules)
    }

    let replacementFixtureId: CutoutFixtureId = SINGLE_CENTER_SLOT_FIXTURE
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
    } else if (SINGLE_LEFT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_LEFT_SLOT_FIXTURE
    }

    const fixtureGroup =
      deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId)
        ?.fixtureGroup ?? {}

    let newDeckConfig = deckConfig
    if (cutoutId in fixtureGroup) {
      const groupMap =
        fixtureGroup[cutoutId]?.find(group =>
          Object.entries(group).every(([cId, cfId]) =>
            deckConfig.find(
              config =>
                config.cutoutId === cId && config.cutoutFixtureId === cfId
            )
          )
        ) ?? {}
      newDeckConfig = deckConfig.map(cutoutConfig =>
        cutoutConfig.cutoutId in groupMap
          ? {
              ...cutoutConfig,
              cutoutFixtureId: replacementFixtureId,
              type: undefined,
            }
          : cutoutConfig
      )
    } else {
      newDeckConfig = deckConfig.map(cutoutConfig =>
        cutoutConfig.cutoutId === cutoutId
          ? {
              ...cutoutConfig,
              cutoutFixtureId: replacementFixtureId,
              type: undefined,
            }
          : cutoutConfig
      )
    }
    setUpdatedDeckConfig(newDeckConfig)
  }

  return {
    addFixtureToCutout,
    removeFixtureFromCutout,
    addFixtureModal:
      targetCutoutId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          closeModal={() => {
            setTargetCutoutId(null)
          }}
          fixtures={fixtures}
          modules={modules}
          deckConfig={deckConfig}
          setUpdatedDeckConfig={setUpdatedDeckConfig}
          setValue={setValue}
          hasGripper={hasGripper}
        />
      ) : null,
  }
}

interface AvailableOptionsProps {
  optionStage: OptionStage
  cutoutId: CutoutId
}
export const getAvailableOptions = (
  props: AvailableOptionsProps
): CutoutConfigExtended[][] => {
  const { optionStage, cutoutId } = props

  let availableOptions: CutoutConfigExtended[][] = []
  if (optionStage === 'fixtureOptions') {
    if (STAGING_AREA_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
            type: 'stagingArea',
          },
        ],
      ]
    }
    if (
      SINGLE_RIGHT_CUTOUTS.includes(cutoutId) ||
      SINGLE_LEFT_CUTOUTS.includes(cutoutId)
    ) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
            type: 'trashBin',
          },
        ],
      ]
    }
  } else if (optionStage === 'moduleOptions') {
    if (ABSORBANCE_READER_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: ABSORBANCE_READER_V1_FIXTURE,
            type: ABSORBANCE_READER_V1,
          },
        ],
      ]
    }
    if (HEATER_SHAKER_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
            type: HEATERSHAKER_MODULE_V1,
          },
        ],
      ]
    }
    availableOptions = [
      ...availableOptions,
      [
        {
          cutoutId,
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          type: MAGNETIC_BLOCK_V1,
        },
      ],
    ]
    if (TEMPERATURE_MODULE_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
            type: TEMPERATURE_MODULE_V2,
          },
        ],
      ]
    }
    if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId: THERMOCYCLER_MODULE_CUTOUTS[0],
            cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE,
            type: THERMOCYCLER_MODULE_V2,
          },
          {
            cutoutId: THERMOCYCLER_MODULE_CUTOUTS[1],
            cutoutFixtureId: THERMOCYCLER_V2_FRONT_FIXTURE,
            type: THERMOCYCLER_MODULE_V2,
          },
        ],
      ]
    }
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
            type: 'stagingAreaAndMagneticBlock',
          },
        ],
      ]
    }
  } else if (optionStage === 'wasteChuteOptions') {
    availableOptions = [
      WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    ].map(fixture => [
      {
        cutoutId,
        cutoutFixtureId: fixture,
        type: 'wasteChute',
      },
    ])
  }

  return availableOptions
}
