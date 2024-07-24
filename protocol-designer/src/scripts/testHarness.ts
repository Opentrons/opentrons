import { stepFormToArgs } from "../steplist/formLevel";
import { FormData, StepType } from "../form-types";
import { CommandCreatorArgs } from "@opentrons/step-generation";

interface TestInput {
    stepType: StepType;
}

function convertTestInputToCommandCreatorArgs(testInput: TestInput): CommandCreatorArgs {
    // Create a mock FormData object based on the testInput
    const mockFormData: FormData = {
        // Populate with necessary fields according to the actual FormData type
        stepType: testInput.stepType,
        // Add other required fields with mock or default values
        id: "mockId",
        // Include all other necessary fields as per your FormData type definition
    };

    // Convert FormData to CommandCreatorArgs using stepFormToArgs
    const commandCreatorArgs = stepFormToArgs(mockFormData);

    if (!commandCreatorArgs) {
        throw new Error("Failed to convert FormData to CommandCreatorArgs");
    }

    return commandCreatorArgs;
}

// Example usage
const testInput: TestInput = {
    stepType: "comment"
};

const commandCreatorArgs = convertTestInputToCommandCreatorArgs(testInput);
console.log(commandCreatorArgs);
