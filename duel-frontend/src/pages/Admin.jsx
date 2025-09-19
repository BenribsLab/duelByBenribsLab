import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Edit, Plus, Shield, Mail, Key, AlertTriangle, LogOut, Swords, BarChart3, Settings, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import adminAuthService from '../services/adminAuthService';
import AdminDuels from '../components/AdminDuels';
import AdminSystem from '../components/AdminSystem';
import AdminInvitations from './AdminInvitations';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState({
    pseudo: '',
    email: '',
    password: '',
    authMode: 'PASSWORD',
    autoValidate: true
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const navigate = useNavigate();

  // Navigation tabs
  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'duels', label: 'Duels', icon: Swords },
    { id: 'invitations', label: 'Invitations', icon: Send },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'system', label: 'Système', icon: Settings }
  ];

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

  const handleCreateUser = async (userData) => {
    try {
      // Validation côté client
      if (!userData.pseudo.trim()) {
        setError('Le pseudo est requis');
        return;
      }

      if (userData.authMode === 'PASSWORD' && !userData.password) {
        setError('Le mot de passe est requis pour le mode PASSWORD');
        return;
      }

      if (userData.authMode === 'OTP' && !userData.email) {
        setError('L\'email est requis pour le mode OTP');
        return;
      }

      // Préparer les données à envoyer
      const dataToSend = {
        pseudo: userData.pseudo.trim(),
        email: userData.email.trim() || null,
        authMode: userData.authMode,
        autoValidate: userData.autoValidate
      };

      // N'ajouter le mot de passe que si on est en mode PASSWORD et qu'il est fourni
      if (userData.authMode === 'PASSWORD' && userData.password) {
        dataToSend.password = userData.password;
      }

      await adminService.createUser(dataToSend);
      
      setShowCreateModal(false);
      setCreatingUser({
        pseudo: '',
        email: '',
        password: '',
        authMode: 'PASSWORD',
        autoValidate: true
      });
      loadUsers();
      loadStats();
      setError(''); // Effacer les erreurs précédentes
    } catch (error) {
      setError(error.message || 'Erreur lors de la création de l\'utilisateur');
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
            Administration
          </h1>
          <p className="text-gray-600 mt-1">Gérer le système de duels</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </button>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Statistiques des utilisateurs */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Emails vérifiés</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.verifiedUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Mode mot de passe</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.passwordUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barre de recherche et actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </button>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer utilisateur
                </button>
                
                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ({selectedUsers.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
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
                    <tr key={user.id} className={selectedUsers.includes(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.pseudo}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email || (
                            <span className="text-gray-400 italic">Aucun email</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.authMode === 'password' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.authMode === 'password' ? 'Mot de passe' : 'Email/OTP'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isValidated 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {user.isValidated ? 'Validé' : 'Non validé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} sur {pagination.pages} ({pagination.total} utilisateurs)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal d'édition */}
          {showEditModal && editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Modifier l'utilisateur</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pseudo</label>
                    <input
                      type="text"
                      value={editingUser.pseudo}
                      onChange={(e) => setEditingUser({...editingUser, pseudo: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={editingUser.password}
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      placeholder="Laisser vide pour ne pas changer"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mode d'authentification</label>
                    <select
                      value={editingUser.authMode}
                      onChange={(e) => setEditingUser({...editingUser, authMode: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="password">Mot de passe</option>
                      <option value="email">Email/OTP</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSaveUser(editingUser)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de création */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Créer un nouvel utilisateur</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pseudo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={creatingUser.pseudo}
                      onChange={(e) => setCreatingUser({...creatingUser, pseudo: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Pseudo de l'utilisateur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mode d'authentification</label>
                    <select
                      value={creatingUser.authMode}
                      onChange={(e) => setCreatingUser({
                        ...creatingUser, 
                        authMode: e.target.value,
                        password: e.target.value === 'OTP' ? '' : creatingUser.password
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PASSWORD">Mot de passe</option>
                      <option value="OTP">Email/OTP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email {creatingUser.authMode === 'OTP' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      value={creatingUser.email}
                      onChange={(e) => setCreatingUser({...creatingUser, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adresse email"
                    />
                  </div>
                  
                  {creatingUser.authMode === 'PASSWORD' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mot de passe <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={creatingUser.password}
                        onChange={(e) => setCreatingUser({...creatingUser, password: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mot de passe"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoValidate"
                      checked={creatingUser.autoValidate}
                      onChange={(e) => setCreatingUser({...creatingUser, autoValidate: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoValidate" className="ml-2 text-sm text-gray-700">
                      Valider automatiquement l'email
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatingUser({
                        pseudo: '',
                        email: '',
                        password: '',
                        authMode: 'PASSWORD',
                        autoValidate: true
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleCreateUser(creatingUser)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'duels' && <AdminDuels />}
      
      {activeTab === 'invitations' && <AdminInvitations />}
      
      {activeTab === 'stats' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiques générales</h2>
          <p className="text-gray-600">Statistiques détaillées à venir...</p>
        </div>
      )}

      {activeTab === 'system' && <AdminSystem />}
    </div>
  );
};

export default Admin;