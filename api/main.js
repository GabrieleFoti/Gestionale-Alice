import apiServices from "./apiServices.js";
import routes from "./routes.js";
import handler from "./handler.js";
import { initDB } from "./db.js";

const services = apiServices();
const apiRoutes = routes(services);

initDB();

const apiHandler = handler(apiRoutes);
export {apiHandler};
