import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { useMemoizedUpdatedDeckConfig } from '/protocol-designer/components/organisms/HardwareConfigurator/hooks/useMemoizedUpdatedDeckConfig'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'

import type {
  CutoutFixtureId,
  CutoutId,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

interface UseUpdateDeckConfigurationFromStartingDeckProps {
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame
  robotType: RobotType
}

export function useUpdateDeckConfigurationFromStartingDeck(
  props: UseUpdateDeckConfigurationFromStartingDeckProps
): void {
  const { activeDeckSetup, robotType } = props
  const dispatch = useDispatch()

  // Compute the correct deck configuration from modules and fixtures
  // This ensures addressable areas (like vacuum dock) have correct positions on mount
  const modules = useMemo(() => {
    return Object.values(activeDeckSetup.modules).reduce((acc, module) => {
      return { ...acc, [module.id]: module }
    }, {})
  }, [activeDeckSetup.modules])

  const fixtures = useMemo(() => {
    return Object.values(activeDeckSetup.additionalEquipmentOnDeck).reduce(
      (acc, fixture) => {
        let cutoutFixtureId: CutoutFixtureId = TRASH_BIN_ADAPTER_FIXTURE
        if (fixture.name === 'stagingArea') {
          cutoutFixtureId = STAGING_AREA_RIGHT_SLOT_FIXTURE
        } else if (fixture.name === 'wasteChute') {
          cutoutFixtureId = WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
        }
        return {
          ...acc,
          [fixture.id]: {
            cutoutId: fixture.location as CutoutId,
            name: fixture.name as 'trashBin' | 'wasteChute' | 'stagingArea',
            cutoutFixtureId,
          },
        }
      },
      {}
    )
  }, [activeDeckSetup.additionalEquipmentOnDeck])

  // Use the computed deck config directly (don't wait for Redux to update)
  const deckConfig = useMemoizedUpdatedDeckConfig(modules, fixtures)

  // Also update Redux state for other components that may need it
  useEffect(() => {
    if (robotType === FLEX_ROBOT_TYPE) {
      dispatch(
        editDeckConfiguration({
          deckConfig,
        })
      )
    }
  }, [dispatch, deckConfig, robotType])
}
