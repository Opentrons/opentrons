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
//     conditionalContinue,
//     requiresConfirmation,
//     confirmAndContinue,
//     cancelConfirm,
//   } = useConditionalConfirm(props.goAhead, props.dangerIsPresent)

//   return (
//     <>
//       {requiresConfirmation && (
//         <AreYouSureModal
//           handleCancel={cancelConfirm}
//           handleContinue={confirmAndContinue}
//         />
//       )}
//       <DangerFormFields />
//       <DangerousSubmit onClick={conditionalContinue} />
//     </>
//   )
// }

export type ConditionalConfirmOutput = {|
  /** should be called when the user attempts the action (eg clicks "DELETE" button) */
  conditionalContinue: () => mixed,
  /** should control the rendering of the confirm UI (eg a modal) */
  requiresConfirmation: boolean,
  /** should be passed into the confirm UI's continue button (eg "CONFIRM" button of modal) */
  confirmAndContinue: () => mixed,
  /** should be passed into the confirm UI's cancel button */
  cancelConfirm: () => mixed,
|}

export const useConditionalConfirm = (
  /** the action we may want to require confirmation for */
  handleContinue: () => mixed,
  /** if no confirmation is needed, we will avoid the modal and immediately call handleContinue */
  needConfirmation: boolean
): ConditionalConfirmOutput => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

  const conditionalContinue = () => {
    if (needConfirmation) {
      setShowConfirmModal(true)
    } else {
      handleContinue()
    }
  }

  return {
    conditionalContinue,
    requiresConfirmation: showConfirmModal,
    confirmAndContinue: () => {
      handleContinue()
      setShowConfirmModal(false)
    },
    cancelConfirm: () => {
      setShowConfirmModal(false)
    },
  }
}
