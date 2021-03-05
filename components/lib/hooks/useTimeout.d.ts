/**
 * React hook to call a function after a delay; adapted from: useInterval
 *
 * @template T (type of the input value)
 * @param {() => unknown} callback (function to call after timeout)
 * @param {number | null} delay (timeout delay, or null to disable the timeout)
 * @returns {void}
 */
export declare function useTimeout(callback: () => unknown, delay: number | null): void;
