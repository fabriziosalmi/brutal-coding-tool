
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
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#333" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} />
        <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
        <Radar
          name="Score"
          dataKey="A"
          stroke={chartColor}
          strokeWidth={2}
          fill={chartColor}
          fillOpacity={0.2}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
          itemStyle={{ color: chartColor }}
          separator=": "
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ScoreChart;
