import type { CommandCreator } from '../../types';
interface ReplaceTipArgs {
    pipette: string;
}
/**
  Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
  Expects 96-well format tip naming system on the tiprack.
  If there's already a tip on the pipette, this will drop it before getting a new one
*/
export declare const replaceTip: CommandCreator<ReplaceTipArgs>;
export {};
