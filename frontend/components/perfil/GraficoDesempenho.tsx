'use client';

import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { AREA_LABEL } from '@/lib/constants';
import type { Area } from '@/types';

interface Item {
  area: Area;
  total: number;
}

/** Barras horizontais (layout vertical) com os casos resolvidos por área. */
export function GraficoDesempenho({ dados }: { dados: Item[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const txt = dark ? '#F5F5F5' : '#0F0F0F';
  const bar = dark ? '#2DD867' : '#1B5E2C';

  const data = dados.map((d) => ({ area: AREA_LABEL[d.area] ?? d.area, total: d.total }));

  if (data.length === 0) {
    return (
      <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
        Nenhum caso resolvido ainda para gerar o gráfico.
      </div>
    );
  }

  return (
    <div className="border border-border rounded p-6 bg-card">
      <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4">Casos resolvidos por área</h3>
      <div style={{ width: '100%', height: Math.max(160, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 8 }}>
            <XAxis type="number" hide domain={[0, 'dataMax + 1']} />
            <YAxis
              type="category"
              dataKey="area"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: txt }}
            />
            <Bar dataKey="total" fill={bar} radius={[0, 4, 4, 0]} barSize={20}>
              <LabelList dataKey="total" position="right" style={{ fontSize: 12, fill: txt, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
