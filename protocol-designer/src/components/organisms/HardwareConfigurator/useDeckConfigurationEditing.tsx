import { useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  ABSORBANCE_READER_CUTOUTS,
  ABSORBANCE_READER_V1,
  ABSORBANCE_READER_V1_FIXTURE,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getReplacementFixtureForFakeFixture,
  getReplacementFixtureForFixtureRemoval,
  HEATER_SHAKER_CUTOUTS,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MODULE_MODELS,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
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
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { editDeckConfiguration } from '../../../step-forms/actions'
import { AddFixtureModal } from './AddFixtureModal'

import type { ReactNode } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type {
  CutoutFixtureId,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckConfiguration,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'
import type { FormModules } from '../../../step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type {
  CutoutConfigExtended,
  InitialDeckStateModules,
  OptionStage,
} from './AddFixtureModal'

interface DeckConfigurationEditingProps {
  addFixtureToCutout: (cutoutId: CutoutId) => void
  removeFixtureFromCutout: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes
  ) => void
  addFixtureModal: ReactNode
}
export function useDeckConfigurationEditing(
  deckConfig: DeckConfiguration,
  modules: FormModules | InitialDeckStateModules,
  fixtures: Fixtures,
  hasGripper: boolean,
  setValue?: UseFormSetValue<WizardFormState>,
  updateInitialDeckState?: (
    value: CutoutConfigExtended[],
    newDeckConfig?: DeckConfiguration
  ) => void
): DeckConfigurationEditingProps {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const dispatch = useDispatch()
  const [targetCutoutId, setTargetCutoutId] = useState<CutoutId | null>(null)

  const addFixtureToCutout = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
  }

  //  removing fixture from changing configuration in the
  //  onboarding flow where state is stored using react-hook-form
  const removeFixtureFromCutoutForOnboarding = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes
  ): void => {
    const thermocyclerCutoutFixtureId =
      cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
      cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE
    const tcCutouts = ['cutoutA1', 'cutoutB1']

    //  remove any fixtures from that cutoutId
    const filteredFixtures = Object.fromEntries(
      Object.entries(fixtures).filter(
        ([_, fixture]) => fixture.cutoutId !== cutoutId
      )
    )
    setValue?.('fixtures', filteredFixtures)

    //  remove any modules from that cutoutId
    const fixturedModules = Object.fromEntries(
      Object.entries(modules).filter(([_, module]) =>
        thermocyclerCutoutFixtureId
          ? !tcCutouts.includes((module.cutoutId as CutoutId) ?? 'cutoutA1')
          : module.cutoutId !== cutoutId
      )
    )
    setValue?.('modules', fixturedModules)

    const newDeckConfig = getNewConfig(
      cutoutId,
      deckConfig,
      cutoutFixtureId,
      deckDef
    )
    dispatch(editDeckConfiguration({ deckConfig: newDeckConfig }))
  }

  const getCutoutFixtureType = (
    cutoutFixtureId: CutoutFixtureId
  ): CutoutConfigExtended['type'] => {
    const thermocyclerCutoutFixtureId =
      cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
      cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE

    if (MODULE_MODELS.includes(cutoutFixtureId as ModuleModel)) {
      return cutoutFixtureId as ModuleModel
    } else {
      if (cutoutFixtureId === 'trashBinAdapter') {
        return 'trashBin'
      } else if (cutoutFixtureId === 'wasteChuteRightAdapterNoCover') {
        return 'wasteChute'
      } else if (thermocyclerCutoutFixtureId) {
        return 'thermocyclerModuleV2'
      } else if (cutoutFixtureId === 'stagingAreaRightSlot') {
        return 'stagingArea'
      } else if (
        cutoutFixtureId === 'stagingAreaSlotWithWasteChuteRightAdapterNoCover'
      ) {
        return 'stagingAreaAndWasteChute'
      }
      return 'stagingAreaAndMagneticBlock'
    }
  }

  //  removing fixture from changing configuration in the
  //  edit hardware sections where state is stored using redux
  const removeFixtureFromCutoutForEditing = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes
  ): void => {
    const newDeckConfig = getNewConfig(
      cutoutId,
      deckConfig,
      cutoutFixtureId,
      deckDef
    )
    // if cutoutFixtureId is a fake one get the translation
    const replacementFixtureId = getReplacementFixtureForFakeFixture(
      cutoutFixtureId
    )
    const type = getCutoutFixtureType(replacementFixtureId)
    updateInitialDeckState?.(
      [{ cutoutId, cutoutFixtureId: replacementFixtureId, type }],
      newDeckConfig
    )
  }

  return {
    addFixtureToCutout,
    removeFixtureFromCutout:
      setValue != null
        ? removeFixtureFromCutoutForOnboarding
        : removeFixtureFromCutoutForEditing,
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
          setValue={setValue}
          hasGripper={hasGripper}
          updateInitialDeckState={updateInitialDeckState}
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
      WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    ].map(fixture => [
      {
        cutoutId,
        cutoutFixtureId: fixture,
        type:
          fixture === WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
            ? 'wasteChute'
            : 'stagingAreaAndWasteChute',
      },
    ])
  }

  return availableOptions
}

export const getNewConfig = (
  cutoutId: CutoutId,
  deckConfig: DeckConfiguration,
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  deckDef: DeckDefinition
): DeckConfiguration => {
  const replacementFixtureId = getReplacementFixtureForFixtureRemoval(
    cutoutFixtureId,
    cutoutId  )

  const fixtureGroup =
    deckDef.cutoutFixtures.find(({ id }) => id === cutoutFixtureId)
      ?.fixtureGroup ?? {}

  let newDeckConfig = deckConfig
  if (cutoutId in fixtureGroup) {
    const groupMap =
      fixtureGroup[cutoutId]?.find(group =>
        Object.entries(group).every(([cId, cfId]) =>
          deckConfig.find(
            config => config.cutoutId === cId && config.cutoutFixtureId === cfId
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
  return newDeckConfig
}
