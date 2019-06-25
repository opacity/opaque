import Axios from "axios";

export async function getPlans(endpoint: string) {
  return Axios.get(endpoint + "/plans");
}
