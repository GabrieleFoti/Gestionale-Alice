import { authMiddleware } from './middleware/authMiddleware.js';

export default function handler(apiRoutes) {
  return async (req, res) => {
    let lambdaRes = { 
      statusCode: 200, 
      body: '', 
      headers: { 'Content-Type': 'application/json' } 
    };

      const event = req;
      let body = {};
      if (event.body) {
        if (typeof event.body === 'string') {
          try {
            body = JSON.parse(event.body);
          } catch {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }), headers: { 'Content-Type': 'application/json' } };
          }
        } else {
          body = event.body;
        }
      }
      req = {
        method: event.requestContext?.http?.method,
        url: event.rawPath + (event.rawQueryString ? '?' + event.rawQueryString : ''),
        headers: event.headers || {},
        body,
      };
      res = {
        status: (code) => {
          lambdaRes.statusCode = code;
          return res;
        },
        json: (data) => {
          lambdaRes.body = JSON.stringify(data);
          return res;
        }
      };

    try {
      const { method, url } = req;
      let [path] = url.split('?');
      
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      console.log(`[API] ${method} ${path}`);

      const route = apiRoutes.find(r => {
        if (r.method.toUpperCase() !== method.toUpperCase()) return false;
        
        let routePath = r.path;
        if (routePath.length > 1 && routePath.endsWith('/')) {
          routePath = routePath.slice(0, -1);
        }

        const pattern = routePath.replace(/:[^\s/]+/g, '([\\w-]+)');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });

      if (!route) {
        console.warn(`[API] Route not found: ${method} ${path}`);
        res.status(404).json({ error: 'Route not found' });
        return lambdaRes;
      }

      if (route.requireAuth !== false) {
        const isAuthenticated = await authMiddleware(req, res);
        if (!isAuthenticated) {
          return lambdaRes;
        }
      }

      if (route.requireAdmin && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Accesso negato: richiesto ruolo admin' });
        return lambdaRes;
      }

      if (route.requiredBody) {
        const missing = route.requiredBody.filter(field => {
          const val = req.body[field];
          return val === undefined || val === null || val === '';
        });
        if (missing.length > 0) {
          res.status(400).json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` });
          return lambdaRes;
        }
      }

      let routePath = route.path;
      if (routePath.length > 1 && routePath.endsWith('/')) {
        routePath = routePath.slice(0, -1);
      }
      const pattern = routePath.replace(/:[^\s/]+/g, '([\\w-]+)');
      const regex = new RegExp(`^${pattern}$`);
      const matches = path.match(regex);
      const params = {};
      
      if (matches) {
        const paramNames = (routePath.match(/:[^\s/]+/g) || []).map(p => p.slice(1));
        paramNames.forEach((name, index) => {
          params[name] = matches[index + 1];
        });
      }

      req.params = params;

      const result = await route.handler(req);
      res.status(200).json(result);
      return lambdaRes;

    } catch (error) {
      console.error('API Error:', error);
      const isAuthError = error.message === 'User not found' || error.message === 'Invalid credentials';
      const statusCode = isAuthError ? 401 : 500;
      const clientMessage = isAuthError ? error.message : 'Internal server error';
      res.status(statusCode).json({ error: clientMessage });
      return lambdaRes;
    }
  };
}
