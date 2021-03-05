/// <reference types="react" />
import type { IconName } from '../icons';
export interface SplashProps {
    /** optional alternative icon name. Defaults to 'logo'. */
    iconName?: IconName;
    /** additional className for Splash */
    className?: string;
}
export declare function Splash(props: SplashProps): JSX.Element;
