import { useSelector } from 'react-redux'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getEnableLiquidClasses } from '../../../../../../feature-flags/selectors'
import { getRobotType } from '../../../../../../file-data/selectors'
import { FirstStepMoveLiquidTools } from './FirstStepMoveLiquidTools'
import { useAssignLiquidClass, useSupportedLiquidClassOptions } from './hooks'
import { LiquidClassesStepTools } from './LiquidClassesStepTools'
import { SecondStepsMoveLiquidTools } from './SecondStepsMoveLiquidTools'

import type { StepFormProps } from '../../types'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const {
    toolboxStep,
    propsForFields,
    formData,
    setShowFormErrorsInNewField,
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
  const robotType = useSelector(getRobotType)

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
            {enableLiquidClasses && robotType === FLEX_ROBOT_TYPE ? (
              <LiquidClassesStepTools
                propsForFields={propsForFields}
                formData={formData}
                setShowFormErrorsInNewField={setShowFormErrorsInNewField}
                type="transfer"
                orderedLiquidClassOptions={orderedSupportedLiquidClassOptions}
              />
            ) : (
              <SecondStepsMoveLiquidTools
                propsForFields={propsForFields}
                formData={formData}
                tab={tab}
                setTab={setTab}
                setShowFormErrorsInNewField={setShowFormErrorsInNewField}
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
            setShowFormErrorsInNewField={setShowFormErrorsInNewField}
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
