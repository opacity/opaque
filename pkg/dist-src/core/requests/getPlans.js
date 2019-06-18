import Axios from "axios";
export async function getPlans(endpoint) {
    return Axios.get(endpoint + "/plans");
}
