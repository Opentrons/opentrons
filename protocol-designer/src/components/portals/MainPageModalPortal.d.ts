import * as React from 'react';
export declare function PortalRoot(): JSX.Element;
export declare function getPortalElem(): HTMLElement | null;
interface Props {
    children: React.ReactNode;
}
/** The children of Portal are rendered into the
 * PortalRoot, if the PortalRoot exists in the DOM */
export declare function Portal(props: Props): JSX.Element | null;
export {};
