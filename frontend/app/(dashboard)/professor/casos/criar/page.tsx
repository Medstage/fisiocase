'use client';

import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import { WizardCriarCaso } from '@/components/caso/WizardCriarCaso';

export default function ProfessorCriarCasoPage() {
  return (
    <ProfessorGuard>
      <WizardCriarCaso modo="professor" />
    </ProfessorGuard>
  );
}
