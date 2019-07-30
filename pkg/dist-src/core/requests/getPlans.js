import Axios from "axios";
/**
 * get a list of available plans
 *
 * @param endpoint
 *
 * @internal
 */
export async function getPlans(endpoint) {
    return Axios.get(endpoint + "/plans");
}
