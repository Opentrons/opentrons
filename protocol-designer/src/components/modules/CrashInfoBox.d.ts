/// <reference types="react" />
interface Props {
    showDiagram?: boolean;
    showMagPipetteCollisons?: boolean | null;
    showTempPipetteCollisons?: boolean | null;
    showHeaterShakerPipetteCollisions?: boolean;
    showHeaterShakerModuleCollisions?: boolean;
    showHeaterShakerLabwareCollisions?: boolean;
}
export declare function CrashInfoBox(props: Props): JSX.Element;
export {};
