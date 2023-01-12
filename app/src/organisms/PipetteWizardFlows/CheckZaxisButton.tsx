import * as React from 'react'
import { PrimaryButton } from '../../atoms/buttons'
import type { ZAxisScrewStatus } from './types'

interface CheckZAxisButtonProps {
  proceedButtonText: string
  setZAxisScrewStatus: React.Dispatch<React.SetStateAction<ZAxisScrewStatus>>
}
export const CheckZAxisButton = (props: CheckZAxisButtonProps): JSX.Element => {
  const { proceedButtonText, setZAxisScrewStatus } = props
  //    TODO(jr, 1/12/23): add logic for checking z axis screw here
  const handleCheckZAxis = (): void => setZAxisScrewStatus('stillAttached')

  return (
    <PrimaryButton onClick={handleCheckZAxis}>
      {proceedButtonText}
    </PrimaryButton>
  )
}
