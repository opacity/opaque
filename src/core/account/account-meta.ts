import { AccountPreferences } from "./account-preferences"

class AccountMeta {
	planSize: number
	paidUntil: number
	preferences: { [key: string]: AccountPreferences }

	constructor ({
		planSize,
		paidUntil,
		preferences = {}
	}: {
		planSize: number
		paidUntil: number
		preferences?: { [key: string]: AccountPreferences }
	}) {
		this.planSize = planSize
		this.paidUntil = paidUntil
		this.preferences = preferences
	}

	setPreference (key: string, preference: AccountPreferences) {
		Object.assign(this.preferences[key], preference)
	}
}

export { AccountMeta }
