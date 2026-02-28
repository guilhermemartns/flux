import React from 'react';
import { useAuth } from '../../auth.jsx';

export default function Perfil() {
  const { user } = useAuth();
  if (!user) return null;
  return null;
}
