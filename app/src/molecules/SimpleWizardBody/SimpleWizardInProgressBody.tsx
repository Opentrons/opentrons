import type * as React from 'react'
import type { StyleProps } from '@opentrons/components'
import { InProgressModal } from '../InProgressModal/InProgressModal'
import { SimpleWizardBodyContainer } from './SimpleWizardBodyContainer'

export type SimpleWizardInProgressBodyProps = React.ComponentProps<
  typeof InProgressModal
> &
  StyleProps

export function SimpleWizardInProgressBody({
  alternativeSpinner,
  description,
  body,
  children,
  ...styleProps
}: SimpleWizardInProgressBodyProps): JSX.Element {
  return (
    <SimpleWizardBodyContainer {...styleProps}>
      <InProgressModal
        alternativeSpinner={alternativeSpinner}
        description={description}
        body={body}
      >
        {children}
      </InProgressModal>
    </SimpleWizardBodyContainer>
  )
}
