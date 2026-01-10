import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import DataTable from '../../components/admin/DataTable';
import { adminAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, selectedRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            
            // Exclude students by default, unless specifically filtered
            if (selectedRole === 'all') {
                // Fetch only teachers and admins (exclude students)
                params.role = 'teacher,admin';
            } else {
                params.role = selectedRole;
            }

            const response = await adminAPI.users.getAll(params);
            setUsers(response.data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            addToast({ type: 'error', message: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (user: any) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;

        try {
            await adminAPI.users.delete(user._id);
            addToast({ type: 'success', message: 'User deleted successfully!' });
            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            addToast({ type: 'error', message: 'Failed to delete user' });
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            await adminAPI.users.update(selectedUser._id, {
                name: selectedUser.name,
                email: selectedUser.email,
                role: selectedUser.role,
            });
            addToast({ type: 'success', message: 'User updated successfully!' });
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Error updating user:', error);
            addToast({ type: 'error', message: 'Failed to update user' });
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        {
            key: 'role',
            label: 'Role',
            render: (value: string) => (
                <Badge variant={value === 'admin' ? 'danger' : value === 'teacher' ? 'primary' : 'secondary'}>
                    {value}
                </Badge>
            ),
        },
        {
            key: 'createdAt',
            label: 'Joined',
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage teachers and admin accounts
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="all">All Staff</option>
                            <option value="teacher">Teachers</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Results Count */}
            {!loading && users.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {users.length} user{users.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {/* Table */}
            <Card className="overflow-hidden">
                <DataTable columns={columns} data={users} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
            </Card>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit User"
                size="md">
                {selectedUser && (
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <Input
                            label="Name"
                            value={selectedUser.name}
                            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={selectedUser.email}
                            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role
                            </label>
                            <select
                                value={selectedUser.role}
                                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" variant="primary" className="flex-1">
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
