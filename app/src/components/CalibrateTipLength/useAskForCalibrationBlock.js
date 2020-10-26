// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import { getUseTrashSurfaceForTipCal } from '../../config'
import { setUseTrashSurfaceForTipCal } from '../../calibration'

import { Portal } from '../portal'

import { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'

export type showModal = boolean => void
export type Invoker = () => void

type PromptModalProps = {|
  startWizard: () => void,
|}

export function useAskForCalibrationBlock(): [
  () => void,
  React.ComponentType<PromptModalProps>,
  boolean | null
] {
  const dispatch = useDispatch<Dispatch>()

  const useTrashSurfaceForTipCalSetting = useSelector(
    getUseTrashSurfaceForTipCal
  )
  const hasCalBlock = React.useRef<boolean | null>(
    useTrashSurfaceForTipCalSetting === null
      ? null
      : useTrashSurfaceForTipCalSetting
  )

  const [showCalBlockPrompt, setShowCalBlockPrompt] = React.useState(false)

  const setHasBlock = (hasBlock: boolean, rememberPreference: boolean) => {
    hasCalBlock.current = hasBlock
    if (rememberPreference) {
      dispatch(setUseTrashSurfaceForTipCal(!hasBlock))
    }
    setShowCalBlockPrompt(false)
  }

  const CalBlockPromptModal = (props: { startWizard: () => void }) =>
    showCalBlockPrompt ? (
      <Portal level="top">
        <AskForCalibrationBlockModal
          setHasBlock={(hasBlock: boolean, rememberPreference: boolean) => {
            setHasBlock(hasBlock, rememberPreference)
            props.startWizard()
          }}
        />
      </Portal>
    ) : null

  return [
    () => {
      setShowCalBlockPrompt(true)
    },
    CalBlockPromptModal,
    hasCalBlock.current,
  ]
}
