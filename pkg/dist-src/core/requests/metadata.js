import Axios from "axios";
import { getPayload } from "../request";
// Metadata as hexstring as of right now
export async function setMetadata(endpoint, hdNode, metadataKey, metadata) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadata, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
}
export async function getMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
}
