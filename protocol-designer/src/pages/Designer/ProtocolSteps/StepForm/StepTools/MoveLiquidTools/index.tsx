import { useSelector } from 'react-redux'

import { getEnableLiquidClasses } from '../../../../../../feature-flags/selectors'
import { FirstStepMoveLiquidTools } from './FirstStepMoveLiquidTools'
import { useAssignLiquidClass } from './hooks/useAssignLiquidClass'
import { useSupportedLiquidClassOptions } from './hooks/useSupportedLiquidClassOptions'
import { LiquidClassesStepTools } from './LiquidClassesStepTools'
import { SecondStepsMoveLiquidTools } from './SecondStepsMoveLiquidTools'

import type { StepFormProps } from '../../types'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const {
    toolboxStep,
    propsForFields,
    formData,
    setShowFormErrors,
    tab,
    setTab,
  } = props
  const enableLiquidClasses = useSelector(getEnableLiquidClasses)
  const orderedLiquidClassOptions = useAssignLiquidClass(
    formData,
    'aspirate_labware',
    'aspirate_wells',
    propsForFields.liquidClass.updateValue
  )

  const orderedSupportedLiquidClassOptions = useSupportedLiquidClassOptions(
    orderedLiquidClassOptions,
    formData
  )

  const renderStepComponent = (): JSX.Element => {
    switch (toolboxStep) {
      case 0:
        return (
          <FirstStepMoveLiquidTools
            propsForFields={propsForFields}
            formData={formData}
          />
        )
      case 1:
        return (
          <>
            {enableLiquidClasses ? (
              <LiquidClassesStepTools
                propsForFields={propsForFields}
                formData={formData}
                setShowFormErrors={setShowFormErrors}
                type="transfer"
                orderedLiquidClassOptions={orderedSupportedLiquidClassOptions}
              />
            ) : (
              <SecondStepsMoveLiquidTools
                propsForFields={propsForFields}
                formData={formData}
                tab={tab}
                setTab={setTab}
                setShowFormErrors={setShowFormErrors}
              />
            )}
          </>
        )
      case 2:
        return (
          <SecondStepsMoveLiquidTools
            propsForFields={propsForFields}
            formData={formData}
            tab={tab}
            setTab={setTab}
            setShowFormErrors={setShowFormErrors}
          />
        )
      default:
        console.warn(
          `Unexpected toolboxStep value: ${toolboxStep}, defaulting to the first step.`
        )
        return (
          <FirstStepMoveLiquidTools
            propsForFields={propsForFields}
            formData={formData}
          />
        )
    }
  }

  return renderStepComponent()
}
