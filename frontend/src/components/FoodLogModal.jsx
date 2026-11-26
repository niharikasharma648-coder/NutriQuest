import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const FOOD_GROUPS = ['Greens', 'Protein', 'Whole Grain'];

export default function FoodLogModal({ isOpen, onClose, onSaved }) {
  const { setProfile, showToast } = useAuth();
  const [mealName, setMealName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState(['Greens']);
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleGroup = (group) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Meal photo must be smaller than 5 MB.');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!mealName.trim()) {
      setError('Please enter what you ate!');
      return;
    }
    if (selectedGroups.length === 0) {
      setError('Select at least one food group.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('meal_name', mealName.trim());
      formData.append('food_groups', JSON.stringify(selectedGroups));
      if (calories) formData.append('calories', calories);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (photoFile) formData.append('photo', photoFile);

      const res = await apiRequest('/api/food-logs', {
        method: 'POST',
        body: formData,
      });

      if (res.profile) setProfile(res.profile);
      showToast(`🍽️ Logged meal! +${res.awardedXp} XP`);
      setMealName('');
      setCalories('');
      setNotes('');
      setPhotoFile(null);
      setPreviewUrl('');
      onSaved?.(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log meal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-xl sm:rounded-xl p-space-lg flex flex-col gap-space-md shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">camera_alt</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-extrabold">
                Daily Plate Logger
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                Log Your Meal
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Meal Name *
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Quinoa & Grilled Chicken Bowl"
              className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1.5">
              Food Groups Included *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FOOD_GROUPS.map((group) => {
                const active = selectedGroups.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-full font-label-sm text-label-sm transition-all ${
                      active
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {active ? 'check' : 'add'}
                    </span>
                    <span>{group}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Est. Calories (optional)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="450"
                className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Meal Photo (Storage)
              </label>
              <label className="w-full h-11 px-3 rounded-DEFAULT bg-surface-container text-primary font-label-sm text-label-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span className="truncate">{photoFile ? photoFile.name : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {previewUrl && (
            <div className="relative rounded-DEFAULT overflow-hidden h-36 bg-surface-container">
              <img src={previewUrl} alt="Meal preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPreviewUrl('');
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-on-surface/70 text-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dining hall lunch, felt energized!"
              className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="rounded-DEFAULT bg-error-container text-on-error-container px-3 py-2 font-body-sm text-body-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-1 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_0_#00422b] active:translate-y-[2px] disabled:opacity-60 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              {submitting ? 'sync' : 'check_circle'}
            </span>
            <span>{submitting ? 'Saving Meal...' : 'Save Meal & Claim XP'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
