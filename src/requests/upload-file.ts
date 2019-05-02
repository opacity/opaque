import { MasterHandle } from "../core/account"

/**
 * an object representation of the parameters of an upload part request
 */
class UploadFileObject {
	/** where the file will be stored on the network */
	Location: string
	/** the index of the current part of the multipart upload */
	PartIndex: number
	/** the index of the final part of the multipart upload */
	EndIndex: number
	/**  */
	ChunkData: Buffer
}

/**
 * an object representation of the parameters of an upload request
 */
class UploadFileRequest {
	Account: string
	AccountSignature: string
	Upload: UploadFileObject
	UploadSignature: string
}

const createUploadFileRequest = (file: Buffer) => {
	// const h = hash(file)
}
