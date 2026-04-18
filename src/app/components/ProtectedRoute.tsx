import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  allowedSubRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[],
  allowedSubRoles?: string[]
}) {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/" replace />;
  
  // If specific roles are required, ensure user matches at least one.
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // If specific sub_roles are required, ensure user matches at least one.
  if (allowedSubRoles && !allowedSubRoles.includes(currentUser.sub_role || '')) {
     // Wait, if it's a student, they might bypass if we only use sub_role for staff.
     // The prompt dictates exact matches. 
     return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
