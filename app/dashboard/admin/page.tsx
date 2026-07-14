'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Search, 
  Users, 
  FileText, 
  TrendingUp, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Building,
  Key
} from 'lucide-react';
import { getCompaniesSummaryAdmin, checkAdminStatus, verifyAdminPasscode } from '@/lib/actions/admin';
import { CompanySummary } from '@/lib/types';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Double security states
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Step 1: Verify user email is in the admin whitelist
  useEffect(() => {
    async function checkAuth() {
      setCheckingAdmin(true);
      setError(null);
      try {
        const isAdminUser = await checkAdminStatus();
        if (!isAdminUser) {
          setError('Non autorisé : Droits administrateur requis.');
        }
      } catch {
        setError("Erreur d'authentification administrateur.");
      } finally {
        setCheckingAdmin(false);
      }
    }
    checkAuth();
  }, []);

  // Step 2: Load actual platform summaries (only called after successful passcode unlock)
  async function loadAdminData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompaniesSummaryAdmin();
      setSummaries(data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setLoading(false);
    }
  }

  // Handle double security passcode submission
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setPasscodeError('');
    try {
      const isValid = await verifyAdminPasscode(passcode);
      if (isValid) {
        setIsUnlocked(true);
        // Load data on successful unlock
        await loadAdminData();
      } else {
        setPasscodeError('Mot de passe de sécurité incorrect.');
      }
    } catch {
      setPasscodeError('Erreur de validation.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getCompaniesSummaryAdmin();
      setSummaries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de rafraîchissement.');
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered companies based on search query
  const filteredSummaries = summaries.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute platform stats
  const totalCompanies = summaries.length;
  const totalClients = summaries.reduce((acc, curr) => acc + curr.client_count, 0);
  const totalInvoices = summaries.reduce((acc, curr) => acc + curr.invoice_count, 0);
  const totalInvoicedAmount = summaries.reduce((acc, curr) => acc + curr.total_invoiced, 0);

  // 1. Loading check while verifying user profile
  if (checkingAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">{"Vérification des autorisations administrateur..."}</p>
      </div>
    );
  }

  // 2. Email Verification Error (Not an Admin)
  if (error && error.includes('Non autorisé')) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-6 border border-rose-100 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2 font-sans">
          Accès Strictement Réservé
        </h1>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          {"Vous n'avez pas les autorisations nécessaires pour accéder à cette interface d'administration."} 
          {"Veuillez vous connecter avec un compte développeur ou administrateur."}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
        >
          Retour au Tableau de Bord
        </button>
      </div>
    );
  }

  // 3. Lock Screen (Authorized admin email, but needs password entry)
  if (!isUnlocked) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 animate-fadeIn">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 shadow-premium text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-6 mx-auto border border-brand-100">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-2 font-sans">
            Double Authentification Admin
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {"Saisissez le mot de passe de sécurité de la console développeur pour déverrouiller l'accès aux comptes de la plateforme."}
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Mot de passe de sécurité"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none transition-colors text-center font-medium placeholder:font-normal"
                required
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs font-semibold text-rose-500 mt-2 text-center animate-pulse">
                  {passcodeError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={verifying}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-md shadow-brand-600/10 disabled:opacity-50"
              >
                {verifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                {"Déverrouiller la Console"}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                {"Retour"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Main Console Panel (Unlocked & Active)
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
              <Shield className="h-3 w-3" /> Console Développeur
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Administration de la Plateforme
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Supervisez les différents comptes, utilisateurs et transactions de Soninkara Facture.
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Companies card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entreprises</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-brand-600">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalCompanies}</p>
          <p className="text-xs text-slate-500 mt-1">Comptes configurés en Afrique</p>
        </div>

        {/* Clients card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clients Totaux</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalClients}</p>
          <p className="text-xs text-slate-500 mt-1">Clients finaux enregistrés</p>
        </div>

        {/* Invoices card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factures Émises</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalInvoices}</p>
          <p className="text-xs text-slate-500 mt-1">{"Documents générés sur l'app"}</p>
        </div>

        {/* Volume card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{"Volume d'Affaires"}</span>
            <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 truncate">
            {loading ? '...' : formatFCFA(totalInvoicedAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total TTC facturé en FCFA</p>
        </div>
      </div>

      {/* Main accounts table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium">
        {/* Table actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900">Registre des Comptes Clients</h2>
          
          {/* Search box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Loader skeleton */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
            <p className="text-sm font-semibold">Récupération sécurisée des comptes...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center text-rose-700">
            <p className="font-bold mb-2">Une erreur est survenue lors du chargement des données</p>
            <p className="text-sm text-rose-600/90 mb-4">{error}</p>
            <button
              onClick={loadAdminData}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Building className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-800 mb-1">Aucune entreprise trouvée</p>
            <p className="text-xs text-slate-500">Essayez de modifier votre terme de recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Entreprise</th>
                  <th className="py-3 px-4">Propriétaire</th>
                  <th className="py-3 px-4 text-center">Clients</th>
                  <th className="py-3 px-4 text-center">Factures</th>
                  <th className="py-3 px-4 text-right">Montant Facturé</th>
                  <th className="py-3 px-4 text-right">Inscrit le</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-sm">
                {filteredSummaries.map((company) => (
                  <tr 
                    key={company.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <td className="py-4 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-brand-600">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p>{company.name}</p>
                          <p className="text-[10px] font-normal text-slate-400 truncate max-w-[150px]">{company.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-600 truncate max-w-[180px]">{company.email || 'Pas d\'email'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{company.phone || 'Pas de tél'}</p>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-600">
                      {company.client_count}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-600">
                      {company.invoice_count}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {formatFCFA(company.total_invoiced)}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-500 text-xs">
                      {formatDateFrench(company.created_at)}
                    </td>
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCompany(company)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 group-hover:border-brand-300 group-hover:text-brand-600 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed accounts modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-md font-sans">Détails du Compte</h3>
                  <p className="text-[10px] text-slate-400">ID: {selectedCompany.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Identity Section */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-brand-600 text-lg font-bold">
                  {selectedCompany.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 font-sans">{selectedCompany.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" /> Enregistré le {formatDateFrench(selectedCompany.created_at)}
                  </p>
                </div>
              </div>

              {/* Core Information Grid */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">{"Coordonnées de l'Entreprise"}</h5>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">E-mail</p>
                      <p className="text-xs text-slate-700 font-semibold truncate">{selectedCompany.email || 'Non renseigné'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <Phone className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</p>
                      <p className="text-xs text-slate-700 font-semibold">{selectedCompany.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 w-full">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Adresse physique</p>
                    <p className="text-xs text-slate-700 font-semibold leading-relaxed">{selectedCompany.address || 'Aucune adresse enregistrée'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 w-full">
                  <Key className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID Utilisateur Supabase (Propriétaire)</p>
                    <p className="text-xs text-slate-500 font-mono select-all truncate">{selectedCompany.owner_id}</p>
                  </div>
                </div>
              </div>

              {/* Financial & Activity Stats */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">{"Statistiques d'Activité"}</h5>
                
                <div className="grid gap-3 grid-cols-3">
                  <div className="rounded-xl border border-slate-200/60 p-4 text-center bg-indigo-50/20">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clients</p>
                    <p className="text-xl font-extrabold text-brand-700 mt-1">{selectedCompany.client_count}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200/60 p-4 text-center bg-blue-50/20">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Factures</p>
                    <p className="text-xl font-extrabold text-blue-700 mt-1">{selectedCompany.invoice_count}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200/60 p-4 text-center bg-violet-50/20">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Facturé</p>
                    <p className="text-sm font-extrabold text-violet-700 mt-2 truncate">
                      {formatFCFA(selectedCompany.total_invoiced)}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSelectedCompany(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
