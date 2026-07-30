import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ChartData {
  name: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: ChartData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useTranslation();
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: -20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `₺${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30,30,35,0.9)', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ fontSize: '13px' }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            name={t('common.income', 'Gelir')} 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            name={t('common.expense', 'Gider')} 
            stroke="#EF4444" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
