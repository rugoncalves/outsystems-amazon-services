namespace OSFramework.Helper {
    export function GetRandomClient(): string {
        return Math.random().toString(36).substring(2).toUpperCase();
    }
}
