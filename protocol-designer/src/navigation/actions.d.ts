import { Page } from './types';
export interface NavigateToPageAction {
    type: 'NAVIGATE_TO_PAGE';
    payload: Page;
}
export declare const navigateToPage: (payload: Page) => NavigateToPageAction;
export interface ToggleNewProtocolModalAction {
    type: 'TOGGLE_NEW_PROTOCOL_MODAL';
    payload: boolean;
}
export declare const toggleNewProtocolModal: (payload: boolean) => ToggleNewProtocolModalAction;
