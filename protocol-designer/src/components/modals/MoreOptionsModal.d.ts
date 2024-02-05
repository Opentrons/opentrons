import * as React from 'react';
import type { FormData } from '../../form-types';
interface Props {
    close: (event?: React.MouseEvent) => unknown;
    formData: FormData;
}
export declare function MoreOptionsModal(props: Props): JSX.Element;
export {};
