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
// Paleta cuidadosamente escolhida pra harmonizar com o verde fisio:
// tons saturados na escala 400-500 (legíveis nos dois temas, sem competir com o brand).
export const CONQUISTA_ICONES: Record<string, { Icon: LucideIcon; cor: string }> = {
  Footprints: { Icon: Footprints, cor: 'text-emerald-500' },   // verde-água — caminhada
  Dumbbell: { Icon: Dumbbell, cor: 'text-sky-500' },           // azul — força
  Award: { Icon: Award, cor: 'text-amber-500' },               // âmbar — premiação
  Flame: { Icon: Flame, cor: 'text-orange-500' },              // laranja — chama
  Star: { Icon: Star, cor: 'text-amber-400' },                 // amarelo — destaque
  GraduationCap: { Icon: GraduationCap, cor: 'text-violet-500' }, // violeta — acadêmico
  Trophy: { Icon: Trophy, cor: 'text-yellow-500' },            // ouro — troféu
  Zap: { Icon: Zap, cor: 'text-amber-400' },                   // amarelo — energia
  Crown: { Icon: Crown, cor: 'text-yellow-500' },              // ouro — coroa
  Bone: { Icon: Bone, cor: 'text-sky-400' },                   // azul claro — ortopedia
  Brain: { Icon: Brain, cor: 'text-fuchsia-500' },             // fúcsia — neuro
  HeartPulse: { Icon: HeartPulse, cor: 'text-rose-500' },      // rosa — cardio
  Sparkles: { Icon: Sparkles, cor: 'text-amber-400' },         // amarelo — brilho
  Rocket: { Icon: Rocket, cor: 'text-pink-500' },              // pink — explosão
  Gem: { Icon: Gem, cor: 'text-cyan-400' },                    // ciano — raridade
};

export function conquistaIcone(icone?: string): { Icon: LucideIcon; cor: string } {
  return CONQUISTA_ICONES[icone ?? ''] ?? { Icon: Award, cor: 'text-green' };
}
