'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { WizardCriarCaso } from '@/components/caso/WizardCriarCaso';

// AdminGuard já injeta o AdminNav internamente, então o wizard é renderizado
// abaixo do sub-nav padrão das telas administrativas.
export default function CriarCasoPage() {
  return (
    <AdminGuard>
      <WizardCriarCaso modo="admin" />
    </AdminGuard>
  );
}
