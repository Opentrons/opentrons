import * as React from 'react';
export interface Announcement {
    announcementKey: string;
    image: React.ReactNode | null;
    heading: string;
    message: React.ReactNode;
}
export declare const useAnnouncements: () => Announcement[];
