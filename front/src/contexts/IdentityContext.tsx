import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'customer' | 'volunteer';

export interface CustomerIdentity {
  id: number;
  name: string;
}

interface IdentityState {
  role: UserRole | null;
  customer?: CustomerIdentity;
}

interface IdentityContextValue {
  state: IdentityState;
  becomeCustomer(customer: CustomerIdentity): void;
  becomeVolunteer(): void;
  clearIdentity(): void;
  updateCustomer(customer: CustomerIdentity): void;
}

const STORAGE_KEY = 'stand-manager.identity';

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

function readStoredIdentity(): IdentityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { role: null };
    }

    const parsed = JSON.parse(raw) as IdentityState;
    if (parsed.role === 'customer' && parsed.customer) {
      return { role: 'customer', customer: parsed.customer };
    }

    if (parsed.role === 'volunteer') {
      return { role: 'volunteer' };
    }
  } catch (error) {
    console.warn('Failed to parse stored identity', error);
  }

  return { role: null };
}

export const IdentityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<IdentityState>(() => readStoredIdentity());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const becomeCustomer = useCallback((customer: CustomerIdentity) => {
    setState({ role: 'customer', customer });
  }, []);

  const becomeVolunteer = useCallback(() => {
    setState({ role: 'volunteer' });
  }, []);

  const clearIdentity = useCallback(() => {
    setState({ role: null });
  }, []);

  const updateCustomer = useCallback((customer: CustomerIdentity) => {
    setState({ role: 'customer', customer });
  }, []);

  const value = useMemo<IdentityContextValue>(
    () => ({ state, becomeCustomer, becomeVolunteer, clearIdentity, updateCustomer }),
    [becomeCustomer, becomeVolunteer, clearIdentity, state, updateCustomer]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
};

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }

  return context;
}
