import { useState } from 'react'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import { AddFixtureModal } from './AddFixtureModal'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { UseFormSetValue } from 'react-hook-form'
import type {
  WizardFixtureType,
  WizardFormState,
} from '../../../pages/Onboarding/types'
import type { FormModules } from '../../../step-forms'

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
    //  remove any fixtures from that cutoutId
    if (
      Object.values(fixtures).some(fixture => fixture.cutoutId === cutoutId)
    ) {
      const filteredFixtures =
        fixtures != null
          ? Object.fromEntries(
              Object.entries(fixtures).filter(
                ([_, fixture]) => fixture.cutoutId !== cutoutId
              )
            )
          : {}
      setValue('fixtures', filteredFixtures)
    }
    //  remove any modules from that cutoutId
    if (Object.values(modules).some(module => module.cutoutId === cutoutId)) {
      const fixturedModules =
        fixtures != null
          ? Object.fromEntries(
              Object.entries(modules).filter(
                ([_, module]) => module.cutoutId !== cutoutId
              )
            )
          : {}
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
              opentronsModuleSerialNumber: undefined,
            }
          : cutoutConfig
      )
    } else {
      newDeckConfig = deckConfig.map(cutoutConfig =>
        cutoutConfig.cutoutId === cutoutId
          ? {
              ...cutoutConfig,
              cutoutFixtureId: replacementFixtureId,
              opentronsModuleSerialNumber: undefined,
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
