import React from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to auto-inject organization_id into form data
 * Ensures that all forms automatically include the current organization
 */
export function useOrganizationForm<T extends { organization_id: string }>(
  initialFormData: T
): {
  formData: T;
  setFormData: (data: T) => void;
  resetFormData: () => void;
} {
  const { organizationId } = useAuth();
  const [formData, setFormDataInternal] = React.useState<T>({
    ...initialFormData,
    organization_id: organizationId || '',
  });

  React.useEffect(() => {
    if (organizationId) {
      setFormDataInternal((prev) => ({
        ...prev,
        organization_id: organizationId,
      }));
    }
  }, [organizationId]);

  const setFormData = (data: T) => {
    setFormDataInternal({
      ...data,
      organization_id: organizationId || '',
    });
  };

  const resetFormData = () => {
    setFormDataInternal({
      ...initialFormData,
      organization_id: organizationId || '',
    });
  };

  return { formData, setFormData, resetFormData };
}
