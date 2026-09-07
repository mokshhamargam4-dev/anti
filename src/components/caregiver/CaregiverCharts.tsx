import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { WeeklyActivityPoint, AccuracyTrendPoint, GamePerformanceDistribution } from '../../services/caregiverService';
import { Calendar, Target, Award } from 'lucide-react';

interface WeeklyActivityChartProps {
  data: WeeklyActivityPoint[];
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Weekly Activity Frequency</h3>
            <p className="text-xs text-slate-500">Games played and duration (minutes) over the past 7 days</p>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          7 Days
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              formatter={(val: number, name: string) => [
                name === 'games' ? `${val} session(s)` : `${val} min(s)`,
                name === 'games' ? 'Sessions Completed' : 'Active Duration',
              ]}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="games" fill="#0D9488" name="Sessions" radius={[6, 6, 0, 0]} />
            <Bar dataKey="minutes" fill="#3B82F6" name="Active Minutes" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface AccuracyTrendChartProps {
  data: AccuracyTrendPoint[];
}

export const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Recall Accuracy Progression</h3>
            <p className="text-xs text-slate-500">Historical precision (%) across recent cognitive exercises</p>
          </div>
        </div>
        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          Accuracy %
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="sessionNumber" stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `S${val}`} />
            <YAxis domain={[0,100]} stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              formatter={(val: number) => [`${val}%`, 'Accuracy']}
              labelFormatter={(val) => `Session #${val}`}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#0D9488"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#accuracyGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface GamePerformanceChartProps {
  data: GamePerformanceDistribution[];
}

export const GamePerformanceChart: React.FC<GamePerformanceChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Game Performance Distribution</h3>
            <p className="text-xs text-slate-500">Average points scored across the 3 cognitive exercises</p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          Cross-Activity
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="gameTitle" stroke="#94A3B8" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              formatter={(val: number) => [`${val} pts`, 'Average Score']}
            />
            <Bar dataKey="avgScore" fill="#D97706" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
