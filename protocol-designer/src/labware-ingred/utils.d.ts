import type { RobotType } from '@opentrons/shared-data';
import type { InitialDeckSetup } from '../step-forms/types';
import type { DeckSlot } from '../types';
export declare function getNextAvailableDeckSlot(initialDeckSetup: InitialDeckSetup, robotType: RobotType): DeckSlot | null | undefined;
export declare function getNextNickname(allNicknames: string[], _proposedNickname: string): string;
