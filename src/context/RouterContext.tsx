import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRoute } from '../types';

interface RouterContextType {
  currentRoute: AppRoute;
  params: Record<string, string>;
  navigate: (route: AppRoute, params?: Record<string, string>) => void;
  isAdmin: boolean;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

const parseHash = (): { route: AppRoute; params: Record<string, string> } => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    return { route: 'home', params: {} };
  }

  const [routePart, queryString] = hash.split('?');
  const validRoutes: AppRoute[] = [
    'home',
    'catalog',
    'product-detail',
    'shein-deals',
    'checkout',
    'login',
    'register',
    'profile',
    'admin-overview',
    'admin-products',
    'admin-categories',
    'admin-shein',
    'admin-orders',
    'admin-customers',
    'admin-users',
    'admin-inventory',
    'admin-shipping',
    'admin-payments',
    'admin-coupons',
    'admin-banners',
    'admin-pages',
    'admin-reports',
    'admin-settings',
  ];

  const matchedRoute = validRoutes.find(r => r === routePart) || 'home';
  const params: Record<string, string> = {};

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return { route: matchedRoute, params };
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routeState, setRouteState] = useState<{ route: AppRoute; params: Record<string, string> }>(
    parseHash
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: AppRoute, params?: Record<string, string>) => {
    let newHash = `#${route}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      newHash += `?${searchParams.toString()}`;
    }
    window.location.hash = newHash;
    setRouteState({ route, params: params || {} });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isAdmin = routeState.route.startsWith('admin-');

  return (
    <RouterContext.Provider
      value={{
        currentRoute: routeState.route,
        params: routeState.params,
        navigate,
        isAdmin,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
