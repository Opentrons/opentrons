import { useSelector } from 'react-redux'

import { DeckConfigurator } from '@opentrons/components'

import { getEnableVacuumModule } from '/protocol-designer/feature-flags/selectors'

import { useDeckConfigurationEditing } from './utils'

import type { UseFormSetValue } from 'react-hook-form'
import type { CutoutConfigMap, DeckConfiguration } from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type { InitialDeckStateModules } from './AddFixtureModal'

interface HardwareConfiguratorContainerProps {
  modules: FormModules | InitialDeckStateModules
  hasGripper: boolean
  fixtures: Fixtures
  deckConfig: DeckConfiguration
  setValue?: UseFormSetValue<WizardFormState>
  updateInitialDeckState?: (
    value: CutoutConfigMap[],
    newDeckConfig?: DeckConfiguration
  ) => void
}
export function HardwareConfiguratorContainer(
  props: HardwareConfiguratorContainerProps
): JSX.Element {
  const {
    modules,
    setValue,
    deckConfig,
    hasGripper,
    fixtures,
    updateInitialDeckState,
  } = props

  const enableVacuumModule = useSelector(getEnableVacuumModule)
  const { addFixtureModal, addFixtureToCutout, removeFixtureFromCutout } =
    useDeckConfigurationEditing(
      deckConfig,
      modules,
      fixtures,
      hasGripper,
      enableVacuumModule,
      setValue,
      updateInitialDeckState
    )
  return (
    <>
      {addFixtureModal}
      <DeckConfigurator
        editableCutoutIds={deckConfig.map(({ cutoutId }) => cutoutId)}
        deckConfig={deckConfig}
        handleClickAdd={addFixtureToCutout}
        handleClickRemove={removeFixtureFromCutout}
      />
    </>
  )
}
