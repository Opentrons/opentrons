export interface ToggleIsGripperRequiredAction {
    type: 'TOGGLE_IS_GRIPPER_REQUIRED';
}
export declare const toggleIsGripperRequired: () => ToggleIsGripperRequiredAction;
export interface CreateDeckFixtureAction {
    type: 'CREATE_DECK_FIXTURE';
    payload: {
        name: 'wasteChute' | 'stagingArea' | 'trashBin';
        id: string;
        location: string;
    };
}
export declare const createDeckFixture: (name: 'wasteChute' | 'stagingArea' | 'trashBin', location: string) => CreateDeckFixtureAction;
export interface DeleteDeckFixtureAction {
    type: 'DELETE_DECK_FIXTURE';
    payload: {
        id: string;
    };
}
export declare const deleteDeckFixture: (id: string) => DeleteDeckFixtureAction;
