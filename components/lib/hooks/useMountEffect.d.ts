/**
 * React hook to call a function on component mount and unmount
 *
 * @param {() => void | (() => void)} callback (function to call on mount that optionally returns a cleanup function to call on unmount)
 * @returns {void}
 */
export declare function useMountEffect(callback: () => void | (() => void)): void;
