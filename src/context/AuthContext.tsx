import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  getAuthUser,
  getOrganizationId,
  removeAuthUser,
  removeOrganizationId,
  saveAuthUser,
  saveOrganizationId,
} from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  organizationId: string | null;
  login: (user: User, organizationId: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const savedOrgId = getOrganizationId();
    if (savedOrgId) setOrganizationId(savedOrgId);
    const savedUser = getAuthUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const login = (nextUser: User, nextOrganizationId: string) => {
    setUser(nextUser);
    setOrganizationId(nextOrganizationId);
    saveOrganizationId(nextOrganizationId);
    saveAuthUser({ id: nextUser.id, name: nextUser.name, email: nextUser.email });
  };

  const logout = () => {
    setUser(null);
    setOrganizationId(null);
    removeOrganizationId();
    removeAuthUser();
  };

  return (
    <AuthContext.Provider value={{ user, organizationId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
