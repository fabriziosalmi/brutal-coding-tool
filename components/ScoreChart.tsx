import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { AuditScores } from '../types';

interface ScoreChartProps {
  scores: AuditScores;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
  const data = [
    { subject: 'Architecture', A: scores.architecture, fullMark: 20 },
    { subject: 'Core Eng', A: scores.core, fullMark: 20 },
    { subject: 'Performance', A: scores.performance, fullMark: 20 },
    { subject: 'Security', A: scores.security, fullMark: 20 },
    { subject: 'QA & Ops', A: scores.qa, fullMark: 20 },
  ];

  const getScoreColor = (score: number) => {
    if (score < 40) return '#ff0033'; // Red
    if (score < 70) return '#ffb000'; // Amber
    return '#00ff41'; // Green
  };

  const chartColor = getScoreColor(scores.total);

  return (
    <div className="w-full h-[300px] bg-terminal-gray/50 rounded-lg border border-gray-800 p-4 relative">
        <div className="absolute top-4 left-4 z-10">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Score</div>
            <div className={`text-4xl font-mono font-bold`} style={{ color: chartColor }}>
                {scores.total}<span className="text-lg text-gray-600">/100</span>
            </div>
        </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} />
          <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="A"
            stroke={chartColor}
            strokeWidth={2}
            fill={chartColor}
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
            itemStyle={{ color: chartColor }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
