/// <reference types="react" />
interface MoveLabwareHeaderProps {
    sourceLabwareNickname?: string | null;
    destinationSlot?: string | null;
    useGripper: boolean;
}
export declare function MoveLabwareHeader(props: MoveLabwareHeaderProps): JSX.Element;
export {};
