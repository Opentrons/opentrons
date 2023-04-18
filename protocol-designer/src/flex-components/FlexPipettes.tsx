import * as React from 'react'
import { i18n } from '../localization'
import { StyledText } from './StyledText'

function FlexPipettesComponent({ formProps }: any): JSX.Element {
  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.pipettes_selection.heading')}
      </StyledText>
    </>
  )
}

export const FlexPipettes = FlexPipettesComponent
