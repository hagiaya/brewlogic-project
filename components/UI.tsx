import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-[#1C1C1E] rounded-[2rem] p-6 border border-zinc-800/50 ${className}`}>
    {children}
  </div>
);

export const Label: React.FC<{ children: ReactNode }> = ({ children }) => (
  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 pl-1">
    {children}
  </label>
);

export const InputField: React.FC<InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <div className="relative group">
    <input 
        {...props}
        className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all"
    />
  </div>
);

interface SelectOption {
    id?: string;
    name?: string;
    label?: string;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: (SelectOption | string)[];
}

export const SelectInput: React.FC<SelectInputProps> = ({ name, value, options, onChange }) => (
  <div className="relative group">
    <select 
      name={name}
      value={value} 
      onChange={onChange}
      className="w-full appearance-none bg-black border border-zinc-800 text-white rounded-2xl py-4 px-5 pr-10 text-sm font-medium focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all"
    >
      {options.map((opt, idx) => {
        const val = typeof opt === 'string' ? opt : (opt.id || opt.label);
        const label = typeof opt === 'string' ? opt : (opt.name || opt.label || opt.id);
        return (
            <option key={idx} value={val} className="bg-zinc-900 text-white">
            {label}
            </option>
        );
      })}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
      <ChevronDown size={18} />
    </div>
  </div>
);