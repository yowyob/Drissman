"use client";

import { useEffect, useState } from "react";
import { Plus, Car, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { vehicleService, type VehicleDto } from "@/lib/vehicle-service";
import { LiveFleetMap } from "@/components/map/live-fleet-map";

export default function VehiclesPage() {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPlate, setFormPlate] = useState("");

  const loadVehicles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setVehicles(await vehicleService.list(token));
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger les véhicules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async () => {
    if (!token) return toast.error("Session expirée — reconnectez-vous");
    if (!formName.trim()) return toast.error("Nom du véhicule obligatoire");
    if (!formPlate.trim()) return toast.error("Immatriculation obligatoire");
    try {
      const created = await vehicleService.create(
        { name: formName.trim(), plateNumber: formPlate.trim().toUpperCase() },
        token,
      );
      setVehicles((prev) => [created, ...prev]);
      setShowModal(false);
      setFormName("");
      setFormPlate("");
      toast.success("Véhicule ajouté à la flotte");
    } catch (error: any) {
      toast.error(error.message || "Échec de création du véhicule");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!token) return;
    try {
      await vehicleService.deactivate(id, token);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Véhicule retiré de la flotte");
    } catch (error: any) {
      toast.error(error.message || "Échec de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-snow">Flotte de véhicules</h1>
          <p className="text-sm text-mist mt-0.5">
            {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""} — suivi GPS en temps réel
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20"
        >
          <Plus className="h-4 w-4" /> Ajouter un véhicule
        </button>
      </div>

      {/* Carte temps réel */}
      {user?.schoolId && <LiveFleetMap schoolId={user.schoolId} />}

      {/* Liste des véhicules */}
      {loading ? (
        <div className="text-sm text-mist/60">Chargement...</div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun véhicule</h3>
          <p className="text-sm text-mist/40 max-w-sm">
            Ajoutez vos véhicules pour activer le suivi GPS pendant les leçons.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-snow">{v.name}</h3>
                  <p className="text-xs text-mist/50 mt-1 font-mono">{v.plateNumber}</p>
                </div>
                <Car className="h-5 w-5 text-signal/60" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-mist/50">
                <MapPin className="h-3.5 w-3.5" />
                {v.lastPositionAt
                  ? `Dernière position : ${new Date(v.lastPositionAt).toLocaleString("fr-FR")}`
                  : "Jamais positionné"}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                <button
                  onClick={() => void handleDeactivate(v.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-mist hover:text-red-400 transition-all"
                  title="Retirer de la flotte"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-asphalt border border-white/10 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-snow mb-5">Nouveau véhicule</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nom (ex. Toyota Yaris 1)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
              />
              <input
                type="text"
                value={formPlate}
                onChange={(e) => setFormPlate(e.target.value)}
                placeholder="Immatriculation (ex. CE-234-AB)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-mist text-sm font-bold hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleCreate()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-signal to-amber-400 text-asphalt text-sm font-bold hover:opacity-90 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
