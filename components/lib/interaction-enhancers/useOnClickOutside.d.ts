import type { SyntheticEvent } from 'react';
export interface UseOnClickOutsideOptions {
    onClickOutside?: (e: SyntheticEvent) => void;
}
export declare const useOnClickOutside: <E extends Element>(options: UseOnClickOutsideOptions) => {
    current: E | null;
};
