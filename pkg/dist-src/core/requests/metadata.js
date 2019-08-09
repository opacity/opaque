import Axios from "axios";
import { getPayload } from "../request";
/**
 * request creating a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export async function createMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/create", signedPayload);
}
/**
 * request deleting a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export async function deleteMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/delete", signedPayload);
}
/**
 * request changing a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 * @param metadata - the metadata to put
 *
 * @internal
 */
export async function setMetadata(endpoint, hdNode, metadataKey, metadata) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadata, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
}
/**
 * request get of a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export async function getMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
}
