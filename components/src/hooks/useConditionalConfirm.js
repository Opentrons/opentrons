// @flow
import { useState } from 'react'
// useConditionalConfirm is intended for cases where we want to block and defer
// a particular user action until the user clicks "ok" in any kind of "are you sure?"
// confirmation UI.
//
//  ========== EXAMPLE ==========
//
// const ExampleDangerForm = props => {
//   const {
//     confirm,
//     showConfirmation,
//     cancel,
//   } = useConditionalConfirm(props.goAhead, props.dangerIsPresent)

//   return (
//     <>
//       {showConfirmation && (
//         <AreYouSureModal
//           handleCancel={cancel}
//           handleContinue={confirm}
//         />
//       )}
//       <DangerFormFields />
//       <DangerousSubmit onClick={confirm} />
//     </>
//   )
// }

export type ConditionalConfirmOutput = {|
  /** should be called when the user attempts the action (eg clicks "DELETE" button) as well as passed into the confirm UI's continue button (eg "CONFIRM" button of modal) */
  confirm: () => mixed,
  /** should control the rendering of the confirm UI (eg a modal) */
  showConfirmation: boolean,
  /** should be passed into the confirm UI's cancel button */
  cancel: () => mixed,
|}

export const useConditionalConfirm = (
  /** the action we may want to require confirmation for */
  handleContinue: () => mixed,
  /** if no confirmation is needed, we will avoid the modal and immediately call handleContinue */
  shouldBlock: boolean
): ConditionalConfirmOutput => {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  const confirm = () => {
    if (shouldBlock && !showConfirmation) {
      setShowConfirmation(true)
    } else {
      setShowConfirmation(false)
      handleContinue()
    }
  }

  return {
    confirm,
    showConfirmation,
    cancel: () => {
      setShowConfirmation(false)
    },
  }
}
