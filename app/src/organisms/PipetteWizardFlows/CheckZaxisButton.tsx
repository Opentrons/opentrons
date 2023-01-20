import * as React from 'react'
import { PrimaryButton } from '../../atoms/buttons'
import type { ZAxisScrewStatus } from './types'

interface CheckZAxisButtonProps {
  proceedButtonText: string
  setZAxisScrewStatus: React.Dispatch<React.SetStateAction<ZAxisScrewStatus>>
  setNumberOfTryAgains: React.Dispatch<React.SetStateAction<number>>
  numberOfTryAgains: number
}
export const CheckZAxisButton = (props: CheckZAxisButtonProps): JSX.Element => {
  const {
    proceedButtonText,
    setZAxisScrewStatus,
    setNumberOfTryAgains,
    numberOfTryAgains,
  } = props
  //    TODO(jr, 1/12/23): add logic for checking z axis screw here
  const handleCheckZAxis = (): void => {
    setZAxisScrewStatus('stillAttached')
    setNumberOfTryAgains(numberOfTryAgains + 1)
  }

  return (
    <PrimaryButton onClick={handleCheckZAxis}>
      {proceedButtonText}
    </PrimaryButton>
  )
}
