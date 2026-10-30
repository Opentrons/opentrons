import { useSelector } from 'react-redux'

import { getPipetteEntities } from '/protocol-designer/step-forms/selectors'

import { useAssignLiquidClass } from '../MoveLiquidTools/hooks/useAssignLiquidClass'
import { useSupportedLiquidClassOptions } from '../MoveLiquidTools/hooks/useSupportedLiquidClassOptions'
import { LiquidClassesStepTools } from '../MoveLiquidTools/LiquidClassesStepTools'
import { TipSettings } from '../MoveLiquidTools/TipSettings'
import { FirstStepMixTools } from './FirstStepMixTools'
import { SecondStepMixTools } from './SecondStepMixTools'

import type { ReactNode } from 'react'
import type { StepFormProps } from '../../types'

export function MixTools(
  props: Omit<
    StepFormProps,
    'focusHandlers' | 'showFormErrors' | 'focusedField'
  >
): ReactNode {
  const {
    propsForFields,
    formData,
    toolboxStep,
    tab,
    setTab,
    setShowFormErrors,
  } = props
  const pipettes = useSelector(getPipetteEntities)

  const orderedLiquidClassOptions = useAssignLiquidClass(
    formData,
    'labware',
    'wells',
    propsForFields.liquidClass.updateValue
  )

  const orderedSupportedLiquidClassOptions = useSupportedLiquidClassOptions(
    orderedLiquidClassOptions,
    formData
  )

  const stepComponents: Record<number, () => JSX.Element> = {
    0: () => (
      <FirstStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        pipettes={pipettes}
      />
    ),
    1: () => (
      <>
        <LiquidClassesStepTools
          propsForFields={propsForFields}
          setShowFormErrors={setShowFormErrors}
          formData={formData}
          orderedLiquidClassOptions={orderedSupportedLiquidClassOptions}
          type="mix"
        />
      </>
    ),

    2: () => (
      <SecondStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        tab={tab}
        setTab={setTab}
      />
    ),

    3: () => (
      <TipSettings
        propsForFields={propsForFields}
        formData={formData}
        stepType="mix"
      />
    ),
  }

  const StepComponent = stepComponents[toolboxStep] ?? stepComponents[0]
  return StepComponent()
}
