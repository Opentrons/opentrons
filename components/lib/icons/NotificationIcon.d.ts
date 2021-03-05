/// <reference types="react" />
import type { IconProps, IconName } from './Icon';
export interface NotificationIconProps extends IconProps {
    /** name constant of the optional notifcation icon to display */
    childName: IconName | null;
    /** color to apply to notification icon (defaults to COLOR_WARNING) */
    childColor?: string;
}
/**
 * Inline SVG icon component with additional nested notification icon. Takes
 * all the same props as Icon in addition to the ones listed above.
 */
export declare function NotificationIcon(props: NotificationIconProps): JSX.Element;
