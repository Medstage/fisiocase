import {
  Footprints,
  Dumbbell,
  Award,
  Flame,
  Star,
  GraduationCap,
  Trophy,
  Zap,
  Crown,
  Bone,
  Brain,
  HeartPulse,
  Sparkles,
  Rocket,
  Gem,
  type LucideIcon,
} from 'lucide-react';

// Mapa do nome do ícone (campo `icone` da conquista) → componente lucide + cor.
// Exceção consciente à paleta flat: as conquistas usam cores para dar destaque.
export const CONQUISTA_ICONES: Record<string, { Icon: LucideIcon; cor: string }> = {
  Footprints: { Icon: Footprints, cor: 'text-green' },
  Dumbbell: { Icon: Dumbbell, cor: 'text-blue-600' },
  Award: { Icon: Award, cor: 'text-amber-500' },
  Flame: { Icon: Flame, cor: 'text-orange-500' },
  Star: { Icon: Star, cor: 'text-amber-500' },
  GraduationCap: { Icon: GraduationCap, cor: 'text-purple-600' },
  Trophy: { Icon: Trophy, cor: 'text-yellow-500' },
  Zap: { Icon: Zap, cor: 'text-red-600' },
  Crown: { Icon: Crown, cor: 'text-yellow-600' },
  Bone: { Icon: Bone, cor: 'text-sky-600' },
  Brain: { Icon: Brain, cor: 'text-purple-500' },
  HeartPulse: { Icon: HeartPulse, cor: 'text-rose-600' },
  Sparkles: { Icon: Sparkles, cor: 'text-yellow-400' },
  Rocket: { Icon: Rocket, cor: 'text-pink-500' },
  Gem: { Icon: Gem, cor: 'text-emerald-500' },
};

export function conquistaIcone(icone?: string): { Icon: LucideIcon; cor: string } {
  return CONQUISTA_ICONES[icone ?? ''] ?? { Icon: Award, cor: 'text-green' };
}
