/** Merge 2 adjacent elements of an array when predicate fn is true */
export declare function mergeWhen<T>(array: T[], predicate: (current: T, next: T) => unknown, merge: (current: T, next: T) => any, alternative?: (current: T) => any): any[];
