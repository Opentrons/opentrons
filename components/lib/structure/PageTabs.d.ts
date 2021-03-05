/// <reference types="react" />
interface TabProps {
    title: string;
    href: string;
    isActive: boolean;
    isDisabled: boolean;
}
export interface PageTabProps {
    pages: TabProps[];
}
export declare function PageTabs(props: PageTabProps): JSX.Element;
export {};
