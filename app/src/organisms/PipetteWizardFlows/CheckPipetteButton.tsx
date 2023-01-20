import * as React from 'react'
import { SUCCESS, FAILURE } from '../../redux/robot-api'
import { PrimaryButton } from '../../atoms/buttons'
import { useCheckPipettes } from './hooks'

interface CheckPipetteButtonProps {
  robotName: string
  proceedButtonText: string
  setPending: React.Dispatch<React.SetStateAction<boolean>>
  proceed: () => void
  isDisabled: boolean
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const {
    robotName,
    proceedButtonText,
    setPending,
    proceed,
    isDisabled,
  } = props
  const { handleCheckPipette, isPending, requestStatus } = useCheckPipettes(
    robotName
  )
  React.useEffect(() => {
    setPending(isPending)
  }, [isPending, setPending])

  React.useEffect(() => {
    //  if requestStatus is FAILURE then the error modal will be in the results page
    if (requestStatus === SUCCESS || requestStatus === FAILURE) proceed()
  }, [proceed, requestStatus])

  return (
    <PrimaryButton disabled={isDisabled} onClick={handleCheckPipette}>
      {proceedButtonText}
    </PrimaryButton>
  )
}
