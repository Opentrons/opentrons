import type * as React from 'react'

import { SimpleWizardBodyContainer } from './SimpleWizardBodyContainer'
import { SimpleWizardBodyContent } from './SimpleWizardBodyContent'
import { SimpleWizardInProgressBody } from './SimpleWizardInProgressBody'
export {
  SimpleWizardBodyContainer,
  SimpleWizardBodyContent,
  SimpleWizardInProgressBody,
}

export function SimpleWizardBody(
  props: React.ComponentProps<typeof SimpleWizardBodyContent> &
    React.ComponentProps<typeof SimpleWizardBodyContainer>
): JSX.Element {
  const { children, ...rest } = props
  return (
    <SimpleWizardBodyContainer {...rest}>
      <SimpleWizardBodyContent {...rest}>{children}</SimpleWizardBodyContent>
    </SimpleWizardBodyContainer>
  )
}
