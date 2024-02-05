import * as React from 'react';
export interface ModalContents {
    title: string;
    body: React.ReactNode;
    okButtonText?: string;
}
