import { ProfileItem, ProfileCycleItem } from '../../../form-types';
import { FocusHandlers } from '../types';
export declare const showProfileFieldErrors: ({ fieldId, focusedField, dirtyFields, }: {
    fieldId: string;
    focusedField?: string | null | undefined;
    dirtyFields: string[];
}) => boolean;
interface ProfileCycleRowProps {
    cycleItem: ProfileCycleItem;
    focusHandlers: FocusHandlers;
    stepOffset: number;
}
export declare const ProfileCycleRow: (props: ProfileCycleRowProps) => JSX.Element;
export interface ProfileItemRowsProps {
    focusHandlers: FocusHandlers;
    orderedProfileItems: string[];
    profileItemsById: {
        [key: string]: ProfileItem;
    };
}
export declare const ProfileItemRows: (props: ProfileItemRowsProps) => JSX.Element;
export {};
