import React from 'react';

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
}

const colorClasses: Record<Color, string> = {
  blue: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  green: 'bg-green-900/40 text-green-300 border border-green-700/50',
  yellow: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
  red: 'bg-red-900/40 text-red-300 border border-red-700/50',
  gray: 'bg-gray-800 text-gray-400 border border-gray-700',
  purple: 'bg-purple-900/40 text-purple-300 border border-purple-700/50',
};

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}
