export declare type UseToggleResult = [boolean, () => void];
/**
 * React hook to toggle a boolean value
 *
 * @param {boolean} [intialValue=false] (initial toggle value)
 * @returns {[boolean, () => void]} (value and setValue tuple)
 *
 * @example
 * import * as React from 'react'
 * import { useToggle } from '@opentrons/components'
 *
 * export function ToggleButton() {
 *   const [enabled, toggleEnabled] = useToggle(true)
 *
 *   return (
 *     <button onClick={toggleEnabled}>
 *       Setting is {enabled ? 'enabled' : 'disabled'}
 *     </button>
 *   )
 * }
 */
export declare function useToggle(initialValue?: boolean): UseToggleResult;
