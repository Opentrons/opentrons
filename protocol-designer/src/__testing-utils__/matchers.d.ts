import type { Matcher } from '@testing-library/react';
export declare const componentPropsMatcher: (matcher: unknown) => any;
export declare const partialComponentPropsMatcher: (argsToMatch: unknown) => any;
export declare const argAtIndex: (index: number, matcher: unknown) => any;
export declare const anyProps: () => any;
export declare const nestedTextMatcher: (textMatch: string | RegExp) => Matcher;
