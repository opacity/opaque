import { AccountPreferences } from "./account-preferences";
declare class AccountMeta {
    planSize: number;
    paidUntil: number;
    preferences: {
        [key: string]: AccountPreferences;
    };
    constructor({ planSize, paidUntil, preferences }: {
        planSize: number;
        paidUntil: number;
        preferences?: {
            [key: string]: AccountPreferences;
        };
    });
    setPreference(key: string, preference: AccountPreferences): void;
}
export { AccountMeta };
