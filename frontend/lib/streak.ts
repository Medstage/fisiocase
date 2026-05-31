export type NivelFogo = 'apagado' | 'pequeno' | 'medio' | 'grande' | 'lendario';

export interface NivelInfo {
  nivel: NivelFogo;
  label: string;
  cor: string; // classe tailwind
  diasParaProximo: number | null;
  proximoNivelDias: number | null;
}

/** Determina o nível do fogo a partir da sequência atual. Espelha a lógica do backend. */
export function calcularNivelFogo(streak: number): NivelInfo {
  if (streak <= 0)
    return { nivel: 'apagado', label: 'Apagado', cor: 'text-neutral-400', diasParaProximo: 1, proximoNivelDias: 1 };
  if (streak <= 6)
    return { nivel: 'pequeno', label: 'Pequena chama', cor: 'text-green', diasParaProximo: 7 - streak, proximoNivelDias: 7 };
  if (streak <= 29)
    return { nivel: 'medio', label: 'Chama média', cor: 'text-green-dark', diasParaProximo: 30 - streak, proximoNivelDias: 30 };
  if (streak <= 89)
    return { nivel: 'grande', label: 'Em chamas', cor: 'text-orange-500', diasParaProximo: 90 - streak, proximoNivelDias: 90 };
  return { nivel: 'lendario', label: 'Lendário', cor: 'text-red-600', diasParaProximo: null, proximoNivelDias: null };
}
