/**
 * useConditionalConfirm is intended for cases where we want to block and defer
 * a particular user action until the user clicks "ok" in any kind of "are you sure?"
 * confirmation UI. The arguments passed to the confirm function will be preserved and
 * used to call handleContinue. Ex. a click event is being deferred by a modal. When the
 * user confirms, the initial click event passed as an argument will be used as the argument in
 * the callback.
 * @param {() => unknown)} handleContinue (the action we may want to require confirmation for)
 * @param {boolean} shouldBlock (if no confirmation is needed, we will avoid the modal and immediately call handleContinue)
 * @example
 * ```js
 * import { useConditionalConfirm } from '@opentrons/components'
 *
 * const ExampleDangerForm = props => {
 * const {
 *   confirm,
 *   showConfirmation,
 *   cancel,
 *  } = useConditionalConfirm(props.goAhead, props.dangerIsPresent)
 *
 *  return (
 *   <>
 *     {showConfirmation && (
 *       <AreYouSureModal
 *         handleCancel={cancel}
 *         handleContinue={confirm}
 *       />
 *     )}
 *     <DangerFormFields />
 *     <DangerousSubmit onClick={confirm} />
 *   </>
 *  )
 * }
 * ```
 */
export declare const useConditionalConfirm: <T>(handleContinue: (...args: T[]) => unknown, shouldBlock: boolean) => {
    confirm: (...args: T[]) => unknown;
    showConfirmation: boolean;
    cancel: () => unknown;
};
