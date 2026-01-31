export default function routes(services) {
  return [
    // Auth routes
    { 
      path: '/api/auth/login', 
      method: 'POST', 
      handler: (req) => services.auth.login(req.body),
      requireAuth: false
    },
    
    // Car routes
    { 
      path: '/api/cars', 
      method: 'GET', 
      handler: (req) => services.cars.getAll(req),
      requireAuth: true
    },
    { 
      path: '/api/cars/:id', 
      method: 'GET', 
      handler: (req) => services.cars.getById(req, req.params.id),
      requireAuth: true
    },
    { 
      path: '/api/cars', 
      method: 'POST', 
      handler: (req) => services.cars.create(req, req.body),
      requireAuth: true
    },
    { 
      path: '/api/cars/:id', 
      method: 'PUT', 
      handler: (req) => services.cars.update(req, req.params.id, req.body),
      requireAuth: true
    },
    { 
      path: '/api/cars/:id', 
      method: 'DELETE', 
      handler: (req) => services.cars.remove(req, req.params.id),
      requireAuth: true
    },
    
    // Work Session routes
    {
      path: '/api/sessions/start',
      method: 'POST',
      handler: (req) => services.workSessions.start(req, req.body.carId, req.body.operatorName),
      requireAuth: true
    },
    {
      path: '/api/sessions/stop',
      method: 'POST',
      handler: (req) => services.workSessions.stop(req, req.body.carId, req.body.operatorName),
      requireAuth: true
    },
    {
      path: '/api/sessions/active/:carId',
      method: 'GET',
      handler: (req) => services.workSessions.getActive(req, req.params.carId),
      requireAuth: true
    },
    {
      path: '/api/sessions/car/:carId',
      method: 'GET',
      handler: (req) => services.workSessions.getByCar(req, req.params.carId),
      requireAuth: true
    }
  ];
}