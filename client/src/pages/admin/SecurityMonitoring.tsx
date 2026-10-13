import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { GlobalSecuritySetting } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  ShieldAlert,
  Lock,
  Eye,
  Sliders,
  CheckCircle2,
  Save,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const SecurityMonitoring: React.FC = () => {
  const { addToast } = useNotification();
  const [settings, setSettings] = useState<GlobalSecuritySetting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/security-settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (e) {
      console.error('Failed to load security settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await api.put('/admin/security-settings', { key, value });
      if (res.data.success) {
        addToast(`Policy "${key}" updated to ${value}`, 'success');
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value } : s))
        );
      }
    } catch (err: any) {
      addToast('Failed to update policy setting', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Integrity Guard
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Global Security & Proctoring Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system-wide browser containment rules, violation thresholds, and proctoring strictness.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Refresh Policies
        </button>
      </div>

      {/* Global Policies Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="font-bold text-base text-navy-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-royal-500" />
            <span>Active Enterprise Security Policies</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes propagate immediately across all live and upcoming examination sessions.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {settings.map((s) => {
              const isBoolean = s.value === 'true' || s.value === 'false';
              const isSaving = savingKey === s.key;

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-royal-700 bg-royal-50 px-2 py-0.5 rounded-md border border-royal-100">
                        {s.key}
                      </span>
                      {isSaving && <RefreshCw className="w-3.5 h-3.5 text-royal-500 animate-spin" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{s.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Configured Value:</span>

                    {isBoolean ? (
                      <button
                        onClick={() =>
                          handleUpdateSetting(s.key, s.value === 'true' ? 'false' : 'true')
                        }
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                          s.value === 'true'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {s.value === 'true' ? 'Enabled' : 'Disabled'}
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          defaultValue={s.value}
                          onBlur={(e) => {
                            if (e.target.value !== s.value) {
                              handleUpdateSetting(s.key, e.target.value);
                            }
                          }}
                          className="w-20 px-2 py-1 text-xs font-bold text-navy-900 bg-white border border-slate-300 rounded-lg text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
