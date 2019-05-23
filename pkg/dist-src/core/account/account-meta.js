class AccountMeta {
    constructor({ planSize, paidUntil, preferences = {} }) {
        this.planSize = planSize;
        this.paidUntil = paidUntil;
        this.preferences = preferences;
    }
    setPreference(key, preference) {
        Object.assign(this.preferences[key], preference);
    }
}
export { AccountMeta };
