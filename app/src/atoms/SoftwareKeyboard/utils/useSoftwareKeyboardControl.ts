import { useMemo } from 'react'

import type { ComponentProps, RefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type Keyboard from 'react-simple-keyboard'

export interface SoftwareKeyboardControlOptions {
  /**
   * The underlying <input> or <textarea> element that the software keyboard should
   * type into.
   */
  inputElementRef: RefObject<HTMLInputElement | HTMLTextAreaElement>

  /**
   * The software keyboard.
   */
  keyboardRef: RefObject<KeyboardReactInterface>
}

/** Props that should be passed to react-simple-keyboard. */
export interface SoftwareKeyboardControlResult {
  beforeInputUpdate: ComponentProps<typeof Keyboard>['beforeInputUpdate']
  onChange: ComponentProps<typeof Keyboard>['onChange']
}

/**
 * This links a react-simple-keyboard instance to an input element, so tapping the keys
 * will "type" into it.
 *
 * Also, react-simple-keyboard unfortunately wants to maintain its own internal copy of
 * the full input value and the caret position. This is redundant with our React state
 * and the DOM state, and it causes various problems when it falls out of sync with them.
 * So this keeps the internal state refreshed to match the latest from the DOM.
 * https://github.com/hodgef/simple-keyboard/issues/2756
 */
export function useSoftwareKeyboardControl(
  options: SoftwareKeyboardControlOptions
): SoftwareKeyboardControlResult {
  const { inputElementRef, keyboardRef } = options

  const result = useMemo<SoftwareKeyboardControlResult>(
    () => ({
      // This will run any time the user taps a react-simple-keyboard button, just before
      // react-simple-keyboard computes what the new value of the input field will be
      // with the new character inserted.
      //
      // This makes sure, before it does that computation, it has the input field's
      // latest value and caret position. They may have been changed in the meantime
      // by React code, by a hardware keyboard, etc.
      beforeInputUpdate: keyboard => {
        const inputElement = inputElementRef.current
        if (
          inputElement instanceof HTMLInputElement ||
          inputElement instanceof HTMLTextAreaElement
        ) {
          keyboard.setInput(inputElement.value)
          keyboard.setCaretPosition(
            inputElement.selectionStart,
            inputElement.selectionEnd
          )
        } else {
          console.error(
            `useSoftwareKeyboardControl requires <input> or <textarea>, but got: ${inputElement}. This is a bug in the caller.`
          )
          keyboard.setInput('')
          keyboard.setCaretPosition(0)
        }
      },

      // This will run after the user has tapped a react-simple-keyboard button,
      // and react-simple-keyboard has computed the new value of the input field,
      // with the new character inserted.
      //
      // This programmatically dispatches an input event with the new value. We're
      // careful to do this in a way that looks to React as if it's just a normal,
      // native input event from a hardware keyboard, so React will call all our event
      // handlers as normal.
      onChange: newValue => {
        const inputElement = inputElementRef.current
        if (!(
          inputElement instanceof HTMLTextAreaElement ||
          inputElement instanceof HTMLInputElement
        )) {
          console.error(
            `useSoftwareKeyboardControl requires <input> or <textarea>, but got: ${inputElement}. This is a bug in the caller.`
          )
          return
        }

        // This is https://stackoverflow.com/questions/23892547 with a couple additions:
        //
        // 1. We call setSelectionRange(). Without this, programmatically setting the
        //    input value causes the cursor to jump to the end.
        // 2. We focus() the element first. Without this, if you enter multiple characters
        //    into the middle of the input, and the input isn't focused, the cursor jumps
        //    to the end. I don't fully understand this, but it seems like setSelectionRange()
        //    requires it.
        inputElement.focus()
        setValue(inputElement, newValue)
        inputElement.setSelectionRange(
          keyboardRef.current?.getCaretPosition() ?? null,
          keyboardRef.current?.getCaretPositionEnd() ?? null
        )
        inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      },
    }),
    [inputElementRef, keyboardRef]
  )

  return result
}

/**
 * This just does `inputElement.value = newValue`, except it uses the native browser
 * implementation, bypassing React's wrapper. Apparently this is necessary for React
 * to detect the change.
 *
 * https://stackoverflow.com/questions/23892547
 */
function setValue(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  newValue: string
): void {
  const prototype =
    inputElement instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!
  nativeSetter.call(inputElement, newValue)
}
