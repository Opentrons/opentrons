import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getDeckConfiguration } from '/protocol-designer/step-forms/selectors'

import { HardwareConfiguratorContainer } from './HardwareConfiguratorContainer'
import { useMemoizedUpdatedDeckConfig } from './hooks/useMemoizedUpdatedDeckConfig'

import type { ReactNode } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { CutoutConfigMap, DeckConfiguration } from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type { InitialDeckStateModules } from './AddFixtureModal'

interface HardwareConfiguratorProps {
  modules: FormModules | InitialDeckStateModules
  hasGripper: boolean
  fixtures: Fixtures
  setValue?: UseFormSetValue<WizardFormState>
  updateInitialDeckState?: (
    value: CutoutConfigMap[],
    newDeckConfig?: DeckConfiguration
  ) => void
}
export function HardwareConfigurator(
  props: HardwareConfiguratorProps
): ReactNode {
  const { modules, setValue, hasGripper, fixtures, updateInitialDeckState } =
    props
  const dispatch = useDispatch()
  const { deckConfig } = useSelector(getDeckConfiguration)
  const updatedDeckConfig = useMemoizedUpdatedDeckConfig(modules, fixtures)

  useEffect(() => {
    dispatch(
      editDeckConfiguration({
        deckConfig: updatedDeckConfig,
      })
    )
  }, [dispatch, updatedDeckConfig])
  return (
    <HardwareConfiguratorContainer
      modules={modules}
      hasGripper={hasGripper ?? false}
      fixtures={fixtures}
      deckConfig={deckConfig}
      setValue={setValue}
      updateInitialDeckState={updateInitialDeckState}
    />
  )
}
