// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import { getUseTrashSurfaceForTipCal } from '../../config'
import { setUseTrashSurfaceForTipCal } from '../../calibration'

import { Portal } from '../portal'

import { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'

export type OnComplete = boolean => void
export type Invoker = (OnComplete | null) => void

export function useAskForCalibrationBlock(
  onComplete: OnComplete | null = null
): [Invoker, React.Node | null] {
  const dispatch = useDispatch<Dispatch>()

  const completer = React.useRef(onComplete)

  const useTrashSurfaceForTipCalSetting = useSelector(
    getUseTrashSurfaceForTipCal
  )
  const useTrashSurface = React.useRef<boolean | null>(
    useTrashSurfaceForTipCalSetting
  )

  const [showCalBlockPrompt, setShowCalBlockPrompt] = React.useState(false)

  const setHasBlock = (hasBlock: boolean, rememberPreference: boolean) => {
    useTrashSurface.current = !hasBlock
    if (rememberPreference) {
      dispatch(setUseTrashSurfaceForTipCal(!hasBlock))
    }
    completer.current && completer.current(hasBlock)
    setShowCalBlockPrompt(false)
  }

  const handleShowRequest = onCompleteOverride => {
    completer.current = onCompleteOverride ?? completer.current
    useTrashSurface.current === null
      ? setShowCalBlockPrompt(true)
      : (() => {
          setShowCalBlockPrompt(false)
          completer.current && completer.current(!useTrashSurface.current)
        })()
  }
  return [
    handleShowRequest,
    showCalBlockPrompt ? (
      <Portal level="top">
        <AskForCalibrationBlockModal setHasBlock={setHasBlock} />
      </Portal>
    ) : null,
  ]
}
