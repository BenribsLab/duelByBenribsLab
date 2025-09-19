import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, TrendingUp, BarChart3, 
  Search, Filter, RefreshCw, Trash2, 
  Send, Calendar, Eye, MousePointer,
  UserPlus, AlertCircle, CheckCircle2,
  Clock, XCircle
} from 'lucide-react';
import adminAuthService from '../services/adminAuthService';

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20
  });

  const statusConfig = {
    PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    SENT: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Mail },
    OPENED: { label: 'Ouvert', color: 'bg-green-100 text-green-800', icon: Eye },
    CLICKED: { label: 'Cliqué', color: 'bg-purple-100 text-purple-800', icon: MousePointer },
    REGISTERED: { label: 'Inscrit', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
    EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  useEffect(() => {
    fetchInvitations();
    fetchStats();
  }, [filters]);

  const fetchInvitations = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/invitations?${queryParams}`, {
        headers: adminAuthService.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/invitations/stats', {
        headers: adminAuthService.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: adminAuthService.getAuthHeaders()
      });

      if (response.ok) {
        fetchInvitations();
        alert('Invitation renvoyée avec succès');
      }
    } catch (error) {
      console.error('Erreur renvoi invitation:', error);
      alert('Erreur lors du renvoi');
    }
  };

  const handleDeleteInvitation = async (invitationId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette invitation ?')) return;

    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: adminAuthService.getAuthHeaders()
      });

      if (response.ok) {
        fetchInvitations();
        alert('Invitation supprimée avec succès');
      }
    } catch (error) {
      console.error('Erreur suppression invitation:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} invitation(s) ?`)) return;

    try {
      const response = await fetch('/api/admin/invitations/bulk-delete', {
        method: 'POST',
        headers: {
          ...adminAuthService.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchInvitations();
        alert('Invitations supprimées avec succès');
      }
    } catch (error) {
      console.error('Erreur suppression bulk:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceCreation = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Invitations</h1>
          <p className="text-gray-600">Suivez et gérez toutes les invitations envoyées</p>
        </div>
        <button
          onClick={fetchInvitations}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.global.totalInvitations}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux d'ouverture</p>
                <p className="text-2xl font-bold text-green-600">{stats.global.openRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de clic</p>
                <p className="text-2xl font-bold text-purple-600">{stats.global.clickRate}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de conversion</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.global.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filtres et actions */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, nom ou inviteur..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Liste des invitations */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedIds.length === invitations.length && invitations.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(invitations.map(inv => inv.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inviteur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => {
                const StatusIcon = statusConfig[invitation.status]?.icon || AlertCircle;
                
                return (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedIds.includes(invitation.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, invitation.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== invitation.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.recipientName || invitation.email}
                        </div>
                        <div className="text-sm text-gray-500">{invitation.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{invitation.inviter.pseudo}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[invitation.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[invitation.status]?.label || invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{formatDate(invitation.createdAt)}</div>
                      <div className="text-xs text-gray-500">{getTimeSinceCreation(invitation.createdAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs space-y-1">
                        {invitation.status !== 'PENDING' && (
                          <div className="text-blue-600">📧 Envoyé: {formatDate(invitation.createdAt)}</div>
                        )}
                        {invitation.openedAt && (
                          <div className="text-green-600">👁️ Ouvert: {formatDate(invitation.openedAt)}</div>
                        )}
                        {invitation.clickedAt && (
                          <div className="text-purple-600">🖱️ Cliqué: {formatDate(invitation.clickedAt)}</div>
                        )}
                        {invitation.registeredAt && (
                          <div className="text-emerald-600">✅ Inscrit: {formatDate(invitation.registeredAt)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {invitation.status !== 'REGISTERED' && (
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Renvoyer l'invitation"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer l'invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {invitations.length === 0 && (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune invitation trouvée</h3>
            <p className="text-gray-500">Les invitations envoyées apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvitations;