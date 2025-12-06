// ExoticArrayManager
function getDeletionIndexes(oldV: number, newV: number): number[] {
    const result = [];
    for (let i = oldV - 1; i >= newV; i--) { // <- oldV - 1, not oldV
        result.push(i);
    }
    return result;
}

function getAdditionIndexes(oldV: number, newV: number): number[] {
    const result = [];
    for (let i = oldV; i < newV; i++) { // <- oldV to newV-1
        result.push(i);
    }
    return result;
}
