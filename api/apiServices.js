import authService from './services/authService.js';
import carService from './services/carService.js';
import workSessionService from './services/workSessionService.js';

export default function apiServices() {

  return {
    auth: authService(),
    cars: carService(),
    workSessions: workSessionService()
  };
}