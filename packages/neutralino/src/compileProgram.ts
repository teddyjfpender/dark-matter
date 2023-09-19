import { Transaction } from "@dark-matter/data-model"; //"./data-model/src/provable-programs";

export const compileProgram = async () => {
    const startTime = new Date().getTime(); // Record the start time

    const artifacts = await Transaction.compile();

    const endTime = new Date().getTime(); // Record the end time

    console.log(`Compilation time: ${endTime - startTime} milliseconds`);

    return artifacts;
}
