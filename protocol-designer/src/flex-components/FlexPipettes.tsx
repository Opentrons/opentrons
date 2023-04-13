import * as React from 'react'
import { RadioSelect } from './RadioSelect'

function FlexPipettesComponent({ formProps }: any): JSX.Element {
  const {
    values: { pipetteSelectionData },
  } = formProps

  return (
    <>
      <RadioSelect
        propsData={formProps}
        pipetteName={'pipetteSelectionData.firstPipette'}
        pipetteType={pipetteSelectionData.firstPipette}
      />
      <br />
      <RadioSelect
        propsData={formProps}
        pipetteName={'pipetteSelectionData.secondPipette'}
        pipetteType={pipetteSelectionData.secondPipette}
      />
    </>
  )
}

export const FlexPipettes = FlexPipettesComponent
