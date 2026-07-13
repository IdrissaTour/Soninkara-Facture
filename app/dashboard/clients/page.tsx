'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, User, Mail, Phone, MapPin, X, ArrowUpRight, Edit, Trash2 } from 'lucide-react';
import { mockClients } from '@/lib/mock-data';
import { Client } from '@/lib/types';
import Link from 'next/link';
import { getClients, createClientAction, updateClientAction, deleteClientAction } from '@/lib/actions/db';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await getClients();
      setClients(data);
    }
    loadData();
  }, []);

  // New client form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  const handleStartEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleStartAdd = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client définitivement ?')) {
      try {
        const success = await deleteClientAction(id);
        if (success) {
          setClients(clients.filter(c => c.id !== id));
        } else {
          alert('Erreur lors de la suppression du client.');
        }
      } catch {
        alert('Erreur de communication avec le serveur.');
      }
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.phone && client.phone.includes(searchQuery))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom du client est requis.');
      return;
    }
    
    const clientInput = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
    };

    try {
      if (editingClient) {
        const updatedClient = await updateClientAction(editingClient.id, clientInput);
        setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
      } else {
        const savedClient = await createClientAction(clientInput);
        setClients([savedClient, ...clients]);
      }

      // Reset and close
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setFormError('');
      setEditingClient(null);
      setIsModalOpen(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du client.';
      setFormError(errorMsg);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registre des clients</h2>
          <p className="text-xs text-slate-500">Gérez les coordonnées et informations de vos partenaires commerciaux.</p>
        </div>
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Ajouter un client
        </button>
      </div>

      {/* Search panel */}
      <div className="relative bg-white p-4 rounded-2xl border border-slate-200/80 shadow-premium">
        <Search className="absolute left-7 top-7.5 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
      </div>

      {/* Grid of clients cards */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200/80 shadow-premium card-hover-effect"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-bold text-brand-600 text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{client.name}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Client entreprise</span>
                    </div>
                  </div>
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 no-print">
                    <button
                      onClick={() => handleStartEdit(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Modifier le client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer le client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{client.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{client.address || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              {/* View invoices for this client */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <Link
                  href={`/dashboard/invoices?search=${client.name}`}
                  className="flex items-center justify-between text-[11px] font-bold text-brand-600 hover:text-brand-700 group/link"
                >
                  <span>Historique des factures</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-premium">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mb-4">
            <User className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Aucun client trouvé</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Essayez de modifier votre recherche ou ajoutez un nouveau client.
          </p>
          <button
            onClick={handleStartAdd}
            className="mt-4 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            Créer un profil client
          </button>
        </div>
      )}

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-150 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClient ? 'Modifier le profil client' : 'Ajouter un nouveau client'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom complet ou raison sociale *</label>
                <input
                  type="text"
                  placeholder="Ex: Teranga S.A.R.L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse email</label>
                <input
                  type="email"
                  placeholder="client@entreprise.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone</label>
                <input
                  type="text"
                  placeholder="Ex: +221 77 500 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse physique</label>
                <textarea
                  placeholder="Ex: Rue 12, Médina, Dakar"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/10"
                >
                  {editingClient ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
