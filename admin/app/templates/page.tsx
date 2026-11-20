'use client';

import React, { useEffect, useState } from 'react';
import { api, HabitTemplate, Category, CreateTemplateRequest } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Calendar,
  Layers,
  Activity,
  Globe,
  Lock,
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HabitTemplate | null>(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<HabitTemplate | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequencyType, setFrequencyType] = useState<'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD'>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetType, setTargetType] = useState<'BOOLEAN' | 'NUMERIC'>('BOOLEAN');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState('#22C55E');
  const [icon, setIcon] = useState('check-circle');
  const [isPublished, setIsPublished] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [tpls, cats] = await Promise.all([api.getTemplates(), api.getCategories()]);
      setTemplates(tpls);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load templates catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id || 'cat-1');
    setFrequencyType('DAILY');
    setSelectedDays([1, 2, 3, 4, 5]);
    setTargetType('BOOLEAN');
    setTargetValue('');
    setUnit('');
    setColor('#22C55E');
    setIcon('activity');
    setIsPublished(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: HabitTemplate) => {
    setEditingTemplate(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setCategoryId(tpl.categoryId);
    setFrequencyType(tpl.frequencyType);
    setSelectedDays(tpl.frequencyPayload || [1, 2, 3, 4, 5]);
    setTargetType(tpl.targetType);
    setTargetValue(tpl.targetValue ?? '');
    setUnit(tpl.unit || '');
    setColor(tpl.color);
    setIcon(tpl.icon);
    setIsPublished(tpl.isPublished);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || title.trim().length < 2) {
      setFormError('Title must be at least 2 characters.');
      return;
    }
    if (!description || description.trim().length < 5) {
      setFormError('Description must be at least 5 characters.');
      return;
    }
    if (targetType === 'NUMERIC' && (!targetValue || Number(targetValue) <= 0)) {
      setFormError('Numeric habits require a positive target value.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload: CreateTemplateRequest = {
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || categories[0]?.id,
      frequencyType,
      frequencyPayload: frequencyType === 'WEEKLY_DAYS' ? selectedDays : undefined,
      targetType,
      targetValue: targetType === 'NUMERIC' ? Number(targetValue) : undefined,
      unit: targetType === 'NUMERIC' ? unit.trim() || undefined : undefined,
      color,
      icon,
      isPublished,
    };

    try {
      if (editingTemplate) {
        await api.updateTemplate(editingTemplate.id, payload);
      } else {
        await api.createTemplate(payload);
      }
      setIsModalOpen(false);
      await fetchCatalog();
    } catch (err: any) {
      setFormError(err.message || 'Failed to persist template.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const togglePublishStatus = async (tpl: HabitTemplate) => {
    try {
      await api.updateTemplate(tpl.id, { isPublished: !tpl.isPublished });
      await fetchCatalog();
    } catch (e) {
      console.error('Failed to toggle publish status:', e);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirmTemplate) return;
    try {
      await api.deleteTemplate(deleteConfirmTemplate.id);
      setDeleteConfirmTemplate(null);
      await fetchCatalog();
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Curated Habit Templates
          </h1>
          <p className="text-xs text-slate-400">
            Publish, edit, and organize proven habit routines available for mobile end-users to adopt in 1-tap.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit Template</span>
        </button>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="mt-4 text-xs font-mono text-slate-400">
            Loading template catalog...
          </span>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 text-xs">
          No templates found. Click "New Habit Template" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => {
            const cat = categories.find((c) => c.id === tpl.categoryId);
            return (
              <div
                key={tpl.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: tpl.color || '#3B82F6' }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                          {tpl.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          {cat?.name || 'General'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePublishStatus(tpl)}
                      title={tpl.isPublished ? 'Click to Unpublish' : 'Click to Publish'}
                      className="cursor-pointer"
                    >
                      {tpl.isPublished ? (
                        <Badge variant="emerald" size="sm">
                          <Globe className="w-3 h-3 mr-1 inline" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="slate" size="sm">
                          <Lock className="w-3 h-3 mr-1 inline" />
                          Draft
                        </Badge>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {tpl.frequencyType}
                    </span>
                    {tpl.targetType === 'NUMERIC' ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                        Target: {tpl.targetValue} {tpl.unit}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                        Binary (Yes/No)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {tpl.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmTemplate(tpl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Edit Habit Template' : 'Create Global Habit Template'}
        description="Curated templates are immediately synchronized to the mobile exploration feed."
        maxWidth="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Template Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 15-Minute Morning Stretch"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clear guidance and motivational rationale for mobile users..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Frequency Cadence
              </label>
              <select
                value={frequencyType}
                onChange={(e) =>
                  setFrequencyType(e.target.value as 'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="DAILY">Daily (7 days / week)</option>
                <option value="WEEKLY_DAYS">Specific Days of Week</option>
                <option value="TIMES_PER_PERIOD">Target Times per Week</option>
              </select>
            </div>
          </div>

          {frequencyType === 'WEEKLY_DAYS' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Active Days Scheduled
              </label>
              <div className="flex gap-2">
                {daysMap.map((d, idx) => {
                  const active = selectedDays.includes(idx);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Type
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as 'BOOLEAN' | 'NUMERIC')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="BOOLEAN">Boolean Checkmark (Done / Not Done)</option>
                <option value="NUMERIC">Numeric Goal (Quantifiable value)</option>
              </select>
            </div>

            {targetType === 'NUMERIC' ? (
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="mins / ml / km"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Color Theme</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="isPublished" className="text-xs text-slate-300 cursor-pointer">
              Publish immediately to mobile discovery feed
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingTemplate ? 'Update Template' : 'Create Template'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTemplate && (
        <Modal
          isOpen={!!deleteConfirmTemplate}
          onClose={() => setDeleteConfirmTemplate(null)}
          title={`Delete Template: ${deleteConfirmTemplate.title}`}
          description="Are you certain you wish to delete this habit template? Existing adopted user habits will remain intact."
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Template ID: <span className="font-mono text-white">{deleteConfirmTemplate.id}</span>
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/25"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
