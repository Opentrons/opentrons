import * as React from 'react'
import { PrimaryButton } from '../../atoms/buttons'
import { usePipettesQuery } from '@opentrons/react-api-client'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setPending: React.Dispatch<React.SetStateAction<boolean>>
  proceed: () => void
  isDisabled: boolean
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const { proceedButtonText, proceed, setPending, isDisabled } = props
  const { status, refetch } = usePipettesQuery()

  React.useEffect(() => {
    //  if requestStatus is error then the error modal will be in the results page
    if (status === 'success' || status === 'error') {
      proceed()
      setPending(false)
    } else if (status === 'loading') {
      setPending(true)
    }
  }, [proceed, status, setPending])

  return (
    <PrimaryButton
      disabled={isDisabled}
      onClick={() => {
        refetch()
          .then(() => {})
          .catch(() => {})
      }}
    >
      {proceedButtonText}
    </PrimaryButton>
  )
}
