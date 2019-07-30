import Axios from "axios";

/**
 * get a list of available plans
 *
 * @param endpoint
 *
 * @internal
 */
export async function getPlans(endpoint: string) {
  return Axios.get(endpoint + "/plans");
}
