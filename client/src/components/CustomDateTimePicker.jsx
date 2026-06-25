import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

export default function CustomDateTimePicker({ value, onChange, label, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [focusField, setFocusField] = useState(null); // 'hours' or 'minutes'
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

  // Parse current value
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(isNaN(initialDate.getTime()) ? new Date() : initialDate);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  
  // Time states
  const [hours, setHours] = useState(value ? new Date(value).getHours() % 12 || 12 : 12);
  const [minutes, setMinutes] = useState(value ? new Date(value).getMinutes() : 0);
  const [ampm, setAmpm] = useState(value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selection when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewDate(d);
        const h = d.getHours();
        setHours(h % 12 || 12);
        setMinutes(d.getMinutes());
        setAmpm(h >= 12 ? 'PM' : 'AM');
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(year, month, day);
    updateDateTime(newDate, hours, minutes, ampm);
  };

  const handleTimeChange = (type, val) => {
    let newHours = hours;
    let newMinutes = minutes;
    let newAmpm = ampm;

    if (type === 'hours') {
      newHours = Math.max(1, Math.min(12, parseInt(val) || 1));
      setHours(newHours);
    } else if (type === 'minutes') {
      newMinutes = Math.max(0, Math.min(59, parseInt(val) || 0));
      setMinutes(newMinutes);
    } else if (type === 'ampm') {
      newAmpm = val;
      setAmpm(newAmpm);
    }

    if (selectedDate) {
      updateDateTime(selectedDate, newHours, newMinutes, newAmpm);
    } else {
      const today = new Date();
      updateDateTime(today, newHours, newMinutes, newAmpm);
    }
  };

  const updateDateTime = (baseDate, h, m, am_pm) => {
    const updated = new Date(baseDate.getTime());
    let militaryHour = h % 12;
    if (am_pm === 'PM') {
      militaryHour += 12;
    }
    updated.setHours(militaryHour);
    updated.setMinutes(m);
    updated.setSeconds(0);
    updated.setMilliseconds(0);

    setSelectedDate(updated);
    
    // Format to YYYY-MM-DDTHH:mm
    const tzoffset = updated.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(updated.getTime() - tzoffset)).toISOString().slice(0, 16);
    onChange(localISOTime);
  };

  const selectToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewDate(today);
    
    const h = today.getHours();
    const currentHours = h % 12 || 12;
    const currentMinutes = today.getMinutes();
    const currentAmpm = h >= 12 ? 'PM' : 'AM';
    
    setHours(currentHours);
    setMinutes(currentMinutes);
    setAmpm(currentAmpm);
    
    updateDateTime(today, currentHours, currentMinutes, currentAmpm);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date & Time';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Select Date & Time';
    
    const day = d.getDate();
    const shortMonth = monthsList[d.getMonth()].slice(0, 3);
    const yr = d.getFullYear();
    
    let h = d.getHours();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${shortMonth} ${yr}, ${h}:${m} ${ap}`;
  };

  // Generate blank grids and day grids
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridCells = [...blanks, ...days];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </span>
      )}

      {/* Input Trigger Button */}
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
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: brandColor }} />
          <span className={selectedDate ? 'text-gray-800' : 'text-gray-400'}>
            {formatDate(selectedDate)}
          </span>
        </span>
        <Clock className="w-4 h-4 text-gray-450 flex-shrink-0" />
      </button>

      {/* Dropdown Calendar Panel */}
      {isOpen && (
        <div className="absolute z-40 w-80 bottom-full mb-2 bg-white border border-gray-150 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-100">
          
          {/* Header: Month & Year Selector */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-800">
              {monthsList[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of Week Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-bold text-gray-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {gridCells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`blank-${idx}`} className="w-8 h-8" />;
              }

              const isSelected = selectedDate && 
                selectedDate.getDate() === cell && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year;

              const isToday = new Date().getDate() === cell && 
                new Date().getMonth() === month && 
                new Date().getFullYear() === year;

              return (
                <button
                  key={`day-${cell}`}
                  type="button"
                  onClick={() => handleDateSelect(cell)}
                  style={{
                    backgroundColor: isSelected ? brandColor : isToday ? `${brandColor}12` : undefined,
                    borderColor: isToday ? `${brandColor}50` : undefined,
                    color: isSelected ? '#ffffff' : isToday ? brandColor : undefined
                  }}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition ${
                    isSelected
                      ? 'font-bold shadow-md'
                      : isToday
                      ? 'border'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="border-t border-gray-100 mt-4 pt-3.5 space-y-2">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Set Time
            </span>
            <div className="flex items-center justify-between gap-3 bg-gray-50 p-2 rounded-xl border border-gray-150">
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                {/* Hours input */}
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={hours.toString().padStart(2, '0')}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  onFocus={() => setFocusField('hours')}
                  onBlur={() => setFocusField(null)}
                  style={{ borderBottomColor: focusField === 'hours' ? brandColor : 'transparent' }}
                  className="w-10 text-center bg-transparent border-b font-bold text-sm text-gray-800 p-0.5 focus:outline-none"
                />
                <span className="text-gray-400 font-bold">:</span>
                {/* Minutes input */}
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes.toString().padStart(2, '0')}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  onFocus={() => setFocusField('minutes')}
                  onBlur={() => setFocusField(null)}
                  style={{ borderBottomColor: focusField === 'minutes' ? brandColor : 'transparent' }}
                  className="w-10 text-center bg-transparent border-b font-bold text-sm text-gray-800 p-0.5 focus:outline-none"
                />
              </div>

              {/* AM/PM Selector Toggle */}
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleTimeChange('ampm', 'AM')}
                  style={{
                    backgroundColor: ampm === 'AM' ? brandColor : undefined,
                    color: ampm === 'AM' ? '#ffffff' : undefined
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                    ampm !== 'AM' ? 'text-gray-500 hover:text-gray-800' : ''
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange('ampm', 'PM')}
                  style={{
                    backgroundColor: ampm === 'PM' ? brandColor : undefined,
                    color: ampm === 'PM' ? '#ffffff' : undefined
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                    ampm !== 'PM' ? 'text-gray-500 hover:text-gray-800' : ''
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-3 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-red-600 transition font-bold px-2 py-1"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectToday}
                style={{ color: brandColor, backgroundColor: `${brandColor}12` }}
                className="px-3 py-1.5 rounded-lg transition font-bold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}20` }}
                className="text-white px-3.5 py-1.5 rounded-lg transition font-bold hover:brightness-110"
              >
                Apply
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
