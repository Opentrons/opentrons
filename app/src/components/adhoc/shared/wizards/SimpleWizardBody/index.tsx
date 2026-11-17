import { SimpleWizardBodyContainer } from './SimpleWizardBodyContainer'
import { SimpleWizardBodyContent } from './SimpleWizardBodyContent'
import { SimpleWizardInProgressBody } from './SimpleWizardInProgressBody'

import type { ComponentProps, ReactNode } from 'react'

export {
  SimpleWizardBodyContainer,
  SimpleWizardBodyContent,
  SimpleWizardInProgressBody,
}

export function SimpleWizardBody(
  props: Omit<
    ComponentProps<typeof SimpleWizardBodyContent> &
      ComponentProps<typeof SimpleWizardBodyContainer>,
    'children'
  > & {
    children?: ReactNode
  }
): ReactNode {
  const { children, ...rest } = props
  return (
    <SimpleWizardBodyContainer {...rest}>
      <SimpleWizardBodyContent {...rest}>{children}</SimpleWizardBodyContent>
    </SimpleWizardBodyContainer>
  )
}
