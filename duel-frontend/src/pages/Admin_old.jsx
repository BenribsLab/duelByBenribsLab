import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Edit, Plus, Shield, Mail, Key, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import adminAuthService from '../services/adminAuthService';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const navigate = useNavigate();

  // Charger les données initiales
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(pagination.page, 20);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      navigate('/admin');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/admin');
    }
  };

    const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.searchUsers(searchQuery, 1, 20);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      setError('Erreur lors de la recherche');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) ?`)) {
      return;
    }

    try {
      // Note: Cette fonctionnalité doit être implémentée côté backend
      await Promise.all(selectedUsers.map(userId => adminService.deleteUser(userId)));
      setSelectedUsers([]);
      loadUsers();
      loadStats();
    } catch (error) {
      setError('Erreur lors de la suppression multiple');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      password: '' // Ne pas pré-remplir le mot de passe
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      await adminService.updateUser(userData.id, {
        pseudo: userData.pseudo,
        email: userData.email || null,
        password: userData.password || undefined,

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/admin/users/${userId}`);
      loadUsers();
      loadStats();
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) ?`)) {
      return;
    }

    try {
      await axios.delete('http://localhost:3001/api/admin/users', {
        data: { userIds: selectedUsers }
      });
      setSelectedUsers([]);
      loadUsers();
      loadStats();
    } catch (error) {
      setError('Erreur lors de la suppression multiple');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      password: '' // Ne pas pré-remplir le mot de passe
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      await adminService.updateUser(userData.id, {
        pseudo: userData.pseudo,
        email: userData.email || null,
        password: userData.password || undefined,
        authMode: userData.authMode
      });
      
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
      loadStats();
    } catch (error) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(user => user.id)
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            Administration des Utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">Gérer les comptes utilisateurs du système</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.total}</h3>
                <p className="text-sm text-gray-600">Total utilisateurs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.byAuthMode.password}</h3>
                <p className="text-sm text-gray-600">Mot de passe</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.byAuthMode.otp}</h3>
                <p className="text-sm text-gray-600">OTP Email</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.emailNotVerified}</h3>
                <p className="text-sm text-gray-600">Emails non vérifiés</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche et actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par pseudo ou email..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Rechercher
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  loadUsers();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Effacer
              </button>
            )}
          </div>
          
          {selectedUsers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table des utilisateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode Auth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.pseudo.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.pseudo}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || 'Aucun'}</div>
                    {user.email && (
                      <div className="text-xs text-gray-500">
                        {user.emailVerified ? '✅ Vérifié' : '❌ Non vérifié'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.authMode === 'PASSWORD' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {user.authMode === 'PASSWORD' ? 'Mot de passe' : 'OTP Email'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> sur{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} utilisateurs)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } ${pageNum === 1 ? 'rounded-l-md' : ''} ${pageNum === Math.min(5, pagination.pages) ? 'rounded-r-md' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

// Composant Modal d'édition
const EditUserModal = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState(user);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Modifier l'utilisateur
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pseudo
            </label>
            <input
              type="text"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode d'authentification
            </label>
            <select
              name="authMode"
              value={formData.authMode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PASSWORD">Mot de passe</option>
              <option value="OTP">OTP Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe (optionnel)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Laisser vide pour ne pas changer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Admin;