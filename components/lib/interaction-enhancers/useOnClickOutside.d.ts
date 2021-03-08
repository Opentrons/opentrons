import type { RefObject } from 'react';
export interface UseOnClickOutsideOptions {
    onClickOutside?: (e: MouseEvent) => void;
}
export declare const useOnClickOutside: <E extends Element>(options: UseOnClickOutsideOptions) => RefObject<E>;
