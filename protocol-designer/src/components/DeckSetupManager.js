// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { getIsMultiSelectMode } from '../ui/steps/selectors'
import { DeckSetup } from './DeckSetup'

export const DeckSetupManager = (): React.Node => {
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  if (isMultiSelectMode) {
    return 'No advanced settings shared between selected steps'
  }
  return <DeckSetup />
}
