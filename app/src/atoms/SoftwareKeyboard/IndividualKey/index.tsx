import { KeyboardReact as Keyboard } from 'react-simple-keyboard'

import {
  customDisplayForIndividual,
  softwareKeyboardButtonAttributes,
} from '../constants'
import { useSoftwareKeyboardControl } from '../utils/useSoftwareKeyboardControl'

import type { MutableRefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { SoftwareKeyboardControlOptions } from '../utils/useSoftwareKeyboardControl'

import '../index.css'
import './index.css'

// TODO (kk:04/05/2024) add debug to make debugging easy
interface IndividualKeyProps {
  keyboardRef: MutableRefObject<KeyboardReactInterface | null>
  /**
   * The underlying element that the software keyboard should type into.
   * See `useSoftwareKeyboardControl()`.
   */
  inputElementRef: SoftwareKeyboardControlOptions['inputElementRef']
  keyText: string
  debug?: boolean
}

export function IndividualKey({
  keyboardRef,
  inputElementRef,
  keyText,
  debug = false,
}: IndividualKeyProps): JSX.Element {
  const numericalKeyboard = {
    layout: {
      default: [`${keyText}`],
    },
  }

  const { beforeInputUpdate, onChange } = useSoftwareKeyboardControl({
    keyboardRef,
    inputElementRef,
  })

  return (
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1 individual-key"
      onChange={onChange}
      beforeInputUpdate={beforeInputUpdate}
      layoutName="default"
      display={customDisplayForIndividual}
      useButtonTag={false} // Exclude from the tab order.
      buttonAttributes={softwareKeyboardButtonAttributes}
      {...numericalKeyboard}
      width="100%"
      debug={debug}
      preventMouseDownDefault // Don't steal focus from inputs.
    />
  )
}
