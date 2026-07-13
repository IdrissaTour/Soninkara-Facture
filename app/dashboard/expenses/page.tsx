'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Tag, FileText, X, Trash2, Edit } from 'lucide-react';
import { mockExpenses } from '@/lib/mock-data';
import { Expense } from '@/lib/types';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { getExpenses, createExpenseAction, deleteExpenseAction, updateExpenseAction } from '@/lib/actions/db';

const EXPENSE_CATEGORIES = [
  'Loyer',
  'Télécoms',
  'Fournitures',
  'Logiciels & Cloud',
  'Salaires',
  'Déplacements',
  'Marketing',
  'Impôts & Taxes',
  'Autre'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getExpenses();
        setExpenses(data);
      } catch (err) {
        console.error('Error loading expenses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartAdd = () => {
    setEditingExpense(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(EXPENSE_CATEGORIES[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleStartEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setCategory(expense.category || EXPENSE_CATEGORIES[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense définitivement ?')) {
      try {
        const success = await deleteExpenseAction(id);
        if (success) {
          setExpenses(expenses.filter(e => e.id !== id));
        } else {
          alert('Erreur lors de la suppression de la dépense.');
        }
      } catch {
        alert('Erreur de communication avec le serveur.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!description.trim()) {
      setFormError('La description est requise.');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Le montant doit être supérieur à 0.');
      return;
    }

    setIsSaving(true);

    const expenseInput = {
      description,
      amount: parsedAmount,
      date,
      category: category || null
    };

    try {
      if (editingExpense) {
        const updatedExpense = await updateExpenseAction(editingExpense.id, expenseInput);
        setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      } else {
        const savedExpense = await createExpenseAction(expenseInput);
        setExpenses([savedExpense, ...expenses]);
      }
      setIsModalOpen(false);
      
      // Reset form
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(EXPENSE_CATEGORIES[0]);
      setEditingExpense(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la dépense.';
      setFormError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.category && expense.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registre des dépenses</h2>
          <p className="text-xs text-slate-500">Suivez et gérez les frais de fonctionnement de votre entreprise.</p>
        </div>
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Ajouter une dépense
        </button>
      </div>

      {/* Grid summarizing expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Dépenses</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatFCFA(totalFilteredAmount)}</h3>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {filteredExpenses.length} dépense{filteredExpenses.length > 1 ? 's' : ''} comptabilisée{filteredExpenses.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Tag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search panel */}
      <div className="relative bg-white p-4 rounded-2xl border border-slate-200/80 shadow-premium">
        <Search className="absolute left-7 top-7.5 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par description, catégorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-2"></div>
          <p className="text-xs text-slate-500 font-bold">Chargement des dépenses...</p>
        </div>
      ) : filteredExpenses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 w-40">Catégorie</th>
                  <th className="py-4 px-6 w-40">Date</th>
                  <th className="py-4 px-6 text-right w-44">Montant</th>
                  <th className="py-4 px-6 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-semibold text-slate-800">{expense.description}</td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {expense.category || 'Autre'}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateFrench(expense.date)}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right font-bold text-slate-900">{formatFCFA(expense.amount)}</td>
                    <td className="py-4.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(expense)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Modifier la dépense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Supprimer la dépense"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-premium animate-fadeIn">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mb-4">
            <Tag className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Aucune dépense trouvée</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Enregistrez les factures d&apos;achat, abonnements ou salaires payés par votre entreprise.
          </p>
          <button
            onClick={handleStartAdd}
            className="mt-4 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            Créer une dépense
          </button>
        </div>
      )}

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-150 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingExpense ? 'Modifier la dépense' : 'Enregistrer une dépense'}</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description *</label>
                <input
                  type="text"
                  placeholder="Ex: Abonnement VPS Cloud"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-colors"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/10 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : editingExpense ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
