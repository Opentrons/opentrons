export type FieldUpdateMaps = Array<{
    prevValue: unknown;
    nextValue: unknown;
    dependentFields: Array<{
        name: string;
        prevValue: unknown;
        nextValue: unknown;
    }>;
}>;
type MakeConditionalPatchUpdater = (updateMaps: FieldUpdateMaps) => (prevValue: unknown, nextValue: unknown, dependentFields: {
    [value: string]: unknown;
}) => {};
export declare const makeConditionalPatchUpdater: MakeConditionalPatchUpdater;
export {};
