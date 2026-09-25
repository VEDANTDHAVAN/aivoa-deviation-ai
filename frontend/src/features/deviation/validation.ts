import type { Deviation } from "../../types/deviation";

export function validateDeviation(
    deviation: Deviation
): string | null {
    if (!deviation.site.trim()) {
        return "Site is required.";
    }
    if (!deviation.dateOfOccurrence) {
        return "Date of occurence is required.";
    }
    if (!deviation.title.trim()) {
        return "Deviation title is required.";
    }
    if (!deviation.source.trim()) {
        return "Source is required.";
    }
    if (!deviation.productMaterial.trim()) {
        return "Product / material is required.";
    }
    if (!deviation.batchLotNumber.trim()) {
        return "Batch / lot number is required.";
    }
    if (!deviation.description.trim()) {
        return "Description is required.";
    }
    if (!deviation.initialSeverity) {
        return "Initial severity is required.";
    }

    return null;
}