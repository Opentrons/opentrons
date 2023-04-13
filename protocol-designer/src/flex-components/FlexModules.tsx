import * as React from 'react'
import { i18n } from '../localization'

function ModulesComponent({ formProps }: any): JSX.Element {
  return (
    <>
      <h1>{i18n.t('flex.modules_selection.heading')}</h1>
    </>
  )
}

export const Modules = ModulesComponent
