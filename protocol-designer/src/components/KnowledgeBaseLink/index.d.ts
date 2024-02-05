import * as React from 'react';
export declare const KNOWLEDGEBASE_ROOT_URL = "https://support.opentrons.com/s/protocol-designer";
export declare const links: {
    readonly airGap: "https://support.opentrons.com/en/articles/4398106-air-gap";
    readonly multiDispense: "https://support.opentrons.com/en/articles/4170341-paths";
    readonly protocolSteps: "https://support.opentrons.com/s/protocol-designer?tabset-92ba3=2";
    readonly customLabware: "https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions";
    readonly recommendedLabware: "https://support.opentrons.com/s/article/What-labware-can-I-use-with-my-modules";
    readonly pipetteGen1MultiModuleCollision: "https://support.opentrons.com/en/articles/4168741-module-placement";
    readonly betaReleases: "https://support.opentrons.com/en/articles/3854833-opentrons-beta-software-releases";
    readonly magneticModuleGenerations: "http://support.opentrons.com/en/articles/1820112-magnetic-module";
};
interface Props {
    to: keyof typeof links;
    children: React.ReactNode;
    className?: string;
}
/** Link which opens a page on the knowledge base to a new tab/window */
export declare function KnowledgeBaseLink(props: Props): JSX.Element;
export {};
