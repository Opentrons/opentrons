import type { CommandCreator } from '../../types';
interface DropTipArgs {
    pipette: string;
}
/** Drop tip if given pipette has a tip. If it has no tip, do nothing. */
export declare const dropTip: CommandCreator<DropTipArgs>;
export {};
