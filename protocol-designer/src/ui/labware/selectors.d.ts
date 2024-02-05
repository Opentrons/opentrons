import type { DropdownOption, Options } from '@opentrons/components';
import type { Selector } from '../../types';
export declare const getLabwareNicknamesById: Selector<Record<string, string>>;
export declare const _sortLabwareDropdownOptions: (options: Options) => Options;
/** Returns options for labware dropdowns.
 * Ordered by display name / nickname, but with trash at the bottom.
 */
export declare const getLabwareOptions: Selector<Options>;
/** Returns waste chute option */
export declare const getWasteChuteOption: Selector<DropdownOption | null>;
/** Returns options for disposal (e.g. trash) */
export declare const getDisposalOptions: Selector<Options>;
