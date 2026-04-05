import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set } from "firebase/database";
import { realtimeDb } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const MAX_CONTACTS = 3;

export default function EmergencyContacts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", relation: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const contactsRef = ref(realtimeDb, `users/${user.uid}/emergencyContacts`);
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      const value = snapshot.val() || {};
      const list = Object.entries(value).map(([id, contact]) => ({
        id,
        ...contact,
      }));
      setContacts(list);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const remaining = useMemo(() => MAX_CONTACTS - contacts.length, [contacts.length]);

  async function handleSave(event) {
    event.preventDefault();
    if (!user?.uid) {
      showToast({ title: "Sign in required", message: "Please sign in first.", tone: "error" });
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.relation.trim()) {
      showToast({ title: "Missing fields", message: "Please fill all contact fields.", tone: "error" });
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      showToast({ title: "Limit reached", message: "You can add up to 3 contacts.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        relation: form.relation.trim(),
        createdAt: Date.now(),
      };
      await push(ref(realtimeDb, `users/${user.uid}/emergencyContacts`), payload);
      setForm({ name: "", phone: "", relation: "" });
      showToast({ title: "Contact added", message: `${payload.name} saved.`, tone: "success" });
    } catch {
      showToast({ title: "Save failed", message: "Could not save contact.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    if (!user?.uid) return;
    try {
      await remove(ref(realtimeDb, `users/${user.uid}/emergencyContacts/${id}`));
      showToast({ title: "Contact removed", message: "Emergency contact deleted.", tone: "neutral" });
    } catch {
      showToast({ title: "Remove failed", message: "Could not remove contact.", tone: "error" });
    }
  }

  async function handleSetPrimary(contact) {
    if (!user?.uid) return;
    await set(ref(realtimeDb, `users/${user.uid}/primaryEmergencyContact`), contact);
    showToast({ title: "Primary contact updated", message: `${contact.name} is now primary.`, tone: "success" });
  }

  return (
    <div className="page-grid">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Emergency</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Emergency contacts</h2>
          <p className="mt-2 text-sm text-slate-300">
            Add up to 3 trusted contacts. These are used by the SOS system for SMS and call alerts.
          </p>
        </header>

        <form onSubmit={handleSave} className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Relation"
              value={form.relation}
              onChange={(event) => setForm((current) => ({ ...current, relation: event.target.value }))}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{remaining} slots left</p>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Add contact"}
            </button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{contact.name}</p>
                  <p className="text-xs text-slate-400">{contact.relation}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                  onClick={() => handleRemove(contact.id)}
                >
                  Remove
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-300">{contact.phone}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/80"
                  onClick={() => (window.location.href = `tel:${contact.phone}`)}
                >
                  Call
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/80"
                  onClick={() => handleSetPrimary(contact)}
                >
                  Set primary
                </button>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No emergency contacts yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
