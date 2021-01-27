import { CryptoMiddleware } from "../../middleware"

import HDKey from "hdkey"
// import secp from "noble-secp256k1"

export type WebAccountMiddlewareArgs = {
	asymmetricKey?: Uint8Array
	symmetricKey?: Uint8Array
}

export class WebAccountMiddleware implements CryptoMiddleware {
	asymmetricKey: Uint8Array
	symmetricKey: Uint8Array

	constructor ({ symmetricKey, asymmetricKey }: WebAccountMiddlewareArgs = {}) {
		this.asymmetricKey = asymmetricKey
		this.symmetricKey = symmetricKey
	}

	async getPublicKey (k: Uint8Array = this.asymmetricKey) {
		const hd = new HDKey()
		hd.privateKey = new Buffer(k.slice(0, 32))
		hd.chainCode = new Buffer(k.slice(32))

		return hd.publicKey
	}

	async derive (k: Uint8Array = this.asymmetricKey, p: string): Promise<Uint8Array> {
		const hd = new HDKey()
		hd.privateKey = new Buffer(k.slice(0, 32))
		hd.chainCode = new Buffer(k.slice(32))

		const derived = hd.derive(p)

		const k2 = Buffer.concat([derived.privateKey, derived.chainCode])

		hd.wipePrivateData()

		return k2
	}

	async sign (k: Uint8Array = this.asymmetricKey, d: Uint8Array) {
		const hd = new HDKey()
		hd.privateKey = new Buffer(k.slice(0, 32))
		hd.chainCode = new Buffer(k.slice(32))

		const sig = hd.sign(new Buffer(d))

		hd.wipePrivateData()

		return sig
	}

	async encrypt (k: Uint8Array = this.symmetricKey, d: Uint8Array) {
		const key = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["encrypt"])
		const iv = crypto.getRandomValues(new Uint8Array(16))
		const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, d))
		return new Uint8Array([...encrypted, ...iv])
	}

	async decrypt (k: Uint8Array = this.symmetricKey, ct: Uint8Array) {
		const key = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"])
		return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: ct.slice(-16) }, key, ct.slice(0, -16)))
	}
}
