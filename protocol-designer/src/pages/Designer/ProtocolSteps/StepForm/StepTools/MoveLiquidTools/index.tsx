import { useSelector } from 'react-redux'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getEnableLiquidClasses } from '../../../../../../feature-flags/selectors'
import { getRobotType } from '../../../../../../file-data/selectors'
import { FirstStepMoveLiquidTools } from './FirstStepMoveLiquidTools'
import { useAssignLiquidClass } from './hooks'
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
                setShowFormErrors={setShowFormErrors}
                type="transfer"
                orderedLiquidClassOptions={orderedLiquidClassOptions}
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
