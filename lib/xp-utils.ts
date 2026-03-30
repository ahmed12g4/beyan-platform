// Level calculation: Level 1 starts at 0 XP, Level 2 at 100, Level 3 at 400, etc.
// Formula: XP = (Level - 1)^2 * 100
// Level = floor(sqrt(XP / 100)) + 1
export function calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function getXpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100
}
