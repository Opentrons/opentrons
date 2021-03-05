/**
 * React hook to call a function on an interval; copied from:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @template T (type of the input value)
 * @param {() => unknown} callback (function to call on an interval)
 * @param {number | null} delay (interval delay, or null to stop interval)
 * @param {boolean} [immediate=false] (trigger the callback immediately before starting the interval)
 * @returns {void}
 */
export declare function useInterval(callback: () => unknown, delay: number | null, immediate?: boolean): void;
