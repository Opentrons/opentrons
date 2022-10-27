import * as React from 'react'
import { PrimaryButton } from '../../atoms/buttons'
import type { PipetteWizardStepProps } from './types'

export const DetachStem = (props: PipetteWizardStepProps): JSX.Element => {
  const { nextStep } = props
  return <PrimaryButton onClick={nextStep}>{'next'}</PrimaryButton>
}
