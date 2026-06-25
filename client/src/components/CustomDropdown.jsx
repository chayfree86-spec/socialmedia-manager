import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomDropdown({ value, onChange, options, label, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);

  const [brandColor, setBrandColor] = useState(() => {
    try {
      const saved = localStorage.getItem('brand_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brandColor) return parsed.brandColor;
      }
    } catch (e) {}
    return '#4f46e5';
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('brand_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.brandColor) {
            setBrandColor(parsed.brandColor);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('brandSettingsUpdated', handleUpdate);
    return () => window.removeEventListener('brandSettingsUpdated', handleUpdate);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </span>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          borderColor: isOpen || isFocused || isHovered ? brandColor : undefined,
          boxShadow: isFocused ? `0 0 0 4px ${brandColor}20` : undefined
        }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-250 bg-white transition text-sm text-gray-800 font-medium shadow-sm focus:outline-none"
      >
        <span className="flex items-center gap-2">
          {selectedOption.icon && <span className="flex-shrink-0 text-base">{selectedOption.icon}</span>}
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-35 w-full mt-2 rounded-xl bg-white border border-gray-150 shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-100 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  backgroundColor: isSelected ? `${brandColor}12` : undefined,
                  color: isSelected ? brandColor : undefined
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors font-medium hover:bg-gray-50 text-gray-700 hover:text-gray-900 ${
                  isSelected ? 'font-semibold' : ''
                }`}
              >
                {opt.icon && <span className="text-base">{opt.icon}</span>}
                <span>{opt.label}</span>
                {isSelected && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
