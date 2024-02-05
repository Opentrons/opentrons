import * as React from 'react';
import { I18nextProvider } from 'react-i18next';
import type { Store } from 'redux';
import type { RenderOptions, RenderResult } from '@testing-library/react';
export interface RenderWithProvidersOptions<State> extends RenderOptions {
    initialState?: State;
    i18nInstance: React.ComponentProps<typeof I18nextProvider>['i18n'];
}
export declare function renderWithProviders<State>(Component: React.ReactElement, options?: RenderWithProvidersOptions<State>): [RenderResult, Store<State>];
