import { authMiddleware } from './middleware/authMiddleware.js';

export default function handler(apiRoutes) {
  return async (req, res) => {
    try {
      const { method, url } = req;
      let [path] = url.split('?');
      
      // Strip trailing slash for consistent matching
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      console.log(`[API] ${method} ${path}`);

      // Simple route matcher
      const route = apiRoutes.find(r => {
        if (r.method.toUpperCase() !== method.toUpperCase()) return false;
        
        let routePath = r.path;
        if (routePath.length > 1 && routePath.endsWith('/')) {
          routePath = routePath.slice(0, -1);
        }

        // Handle basic dynamic routes like /api/machines/:id
        const pattern = routePath.replace(/:[^\s/]+/g, '([\\w-]+)');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });

      if (!route) {
        console.warn(`[API] Route not found: ${method} ${path}`);
        return res.status(404).json({ error: 'Route not found' });
      }

      // Apply authentication middleware if route requires auth
      if (route.requireAuth !== false) {
        const isAuthenticated = authMiddleware(req, res);
        if (!isAuthenticated) {
          return; // Response already sent by middleware
        }
      }

      // Extract params
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
      return res.status(200).json(result);

    } catch (error) {
      console.error('API Error:', error);
      return res.status(error.message === 'User not found' || error.message === 'Invalid credentials' ? 401 : 500).json({ 
        error: error.message 
      });
    }
  };
}