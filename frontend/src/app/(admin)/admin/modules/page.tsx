"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Layers, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useLocalStorage } from "@/hooks";
import { adminModuleService, type AdminModuleDto } from "@/lib/admin-module-service";

interface LessonItem {
  id: string;
  name: string;
}

type ModuleLessonsMap = Record<string, LessonItem[]>;

const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  CODE: { label: "Code", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "📖" },
  CONDUITE: { label: "Conduite", color: "bg-signal/10 text-signal border-signal/20", icon: "🚗" },
  EXAMEN_BLANC: { label: "Examen Blanc", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: "📝" },
};

export default function ModulesPage() {
  const { token } = useAuth();
  const [modules, setModules] = useState<AdminModuleDto[]>([]);
  const [lessonsByModule, setLessonsByModule] = useLocalStorage<ModuleLessonsMap>("module_lessons_map", {});
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModuleDto | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<AdminModuleDto["category"]>("CODE");
  const [formDescription, setFormDescription] = useState("");
  const [formHours, setFormHours] = useState(10);
  const [formLessons, setFormLessons] = useState("");

  const filteredModules = useMemo(
    () => modules.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [modules, searchQuery],
  );

  const parseLessons = (raw: string): LessonItem[] =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ id: crypto.randomUUID(), name }));

  const loadModules = async () => {
    if (!token) return;
    try {
      const data = await adminModuleService.list(token);
      setModules(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les modules");
    }
  };

  useEffect(() => {
    void loadModules();
  }, [token]);

  const openCreate = () => {
    setEditingModule(null);
    setFormName("");
    setFormCategory("CODE");
    setFormDescription("");
    setFormHours(10);
    setFormLessons("");
    setShowModal(true);
  };

  const openEdit = (mod: AdminModuleDto) => {
    setEditingModule(mod);
    setFormName(mod.name);
    setFormCategory(mod.category);
    setFormDescription(mod.description || "");
    setFormHours(mod.requiredHours || 1);
    setFormLessons((lessonsByModule[mod.id] || []).map((l) => l.name).join("\n"));
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!formName.trim()) return toast.error("Le nom du module est obligatoire");
    const lessons = parseLessons(formLessons);

    try {
      if (editingModule) {
        const updated = await adminModuleService.update(
          editingModule.id,
          {
            name: formName.trim(),
            category: formCategory,
            description: formDescription.trim(),
            orderIndex: editingModule.orderIndex,
            requiredHours: formHours,
          },
          token,
        );
        setModules((prev) => prev.map((m) => (m.id === editingModule.id ? updated : m)));
        setLessonsByModule((prev) => ({ ...prev, [editingModule.id]: lessons }));
        toast.success("Module modifie");
      } else {
        const created = await adminModuleService.create(
          {
            name: formName.trim(),
            category: formCategory,
            description: formDescription.trim(),
            orderIndex: modules.length + 1,
            requiredHours: formHours,
          },
          token,
        );
        setModules((prev) => [...prev, created]);
        setLessonsByModule((prev) => ({ ...prev, [created.id]: lessons }));
        toast.success(`Module "${created.name}" cree`);
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Operation impossible");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await adminModuleService.remove(id, token);
      setModules((prev) => prev.filter((m) => m.id !== id));
      setLessonsByModule((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Module supprime");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-snow">Modules</h1>
          <p className="text-sm text-mist mt-0.5">{modules.length} module(s) configure(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20"
        >
          <Plus className="h-4 w-4" /> Nouveau module
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un module..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-snow placeholder:text-mist/40 text-sm"
        />
      </div>

      {filteredModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun module</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredModules.map((mod) => {
            const cat = categoryConfig[mod.category] || categoryConfig.CODE;
            const lessons = lessonsByModule[mod.id] || [];
            return (
              <div key={mod.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 flex items-center gap-4 hover:border-white/10 transition-all group">
                <div className={`p-2.5 rounded-xl border text-sm ${cat.color} shrink-0`}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-snow truncate">{mod.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cat.color}`}>{cat.label}</span>
                  </div>
                  <p className="text-xs text-mist/50 truncate">{mod.description}</p>
                </div>
                <div className="hidden lg:flex items-center gap-6 shrink-0">
                  <div className="text-center"><p className="text-sm font-bold text-snow">{mod.requiredHours}h</p><p className="text-[10px] text-mist/40">Requis</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-snow">{lessons.length}</p><p className="text-[10px] text-mist/40">Lecons</p></div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(mod)} className="p-2 rounded-lg hover:bg-white/5 text-mist hover:text-snow transition-all" title="Modifier"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => void handleDelete(mod.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-mist hover:text-red-400 transition-all" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-snow mb-5">{editingModule ? "Modifier le module" : "Nouveau module"}</h2>
            <div className="space-y-4">
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nom du module" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as AdminModuleDto["category"])} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm">
                <option value="CODE" className="bg-asphalt">Code</option>
                <option value="CONDUITE" className="bg-asphalt">Conduite</option>
                <option value="EXAMEN_BLANC" className="bg-asphalt">Examen Blanc</option>
              </select>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm resize-none" />
              <input type="number" value={formHours} onChange={(e) => setFormHours(Number(e.target.value))} min={1} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
              <textarea value={formLessons} onChange={(e) => setFormLessons(e.target.value)} rows={5} placeholder={"Une lecon par ligne"} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm resize-none" />
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-mist text-sm font-bold">Annuler</button>
                <button onClick={() => void handleSubmit()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-black">
                  {editingModule ? "Enregistrer" : "Creer le module"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
