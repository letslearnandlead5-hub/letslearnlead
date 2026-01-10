import React, { useState, useEffect } from 'react';
import { Search, Download, UserX, UserCheck, Eye, BookOpen, Users, GraduationCap, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';

interface Student {
    _id: string;
    name: string;
    email: string;
    role: string;
    isBlocked?: boolean;
    enrollments?: any[];
    createdAt: string;
}

const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchStudents();
    }, [searchTerm]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params: any = { role: 'student' };
            if (searchTerm) params.search = searchTerm;

            const response = await adminAPI.users.getAll(params);
            setStudents(response.data || []);
        } catch (error: any) {
            console.error('Error fetching students:', error);
            addToast({ type: 'error', message: 'Failed to load students' });
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUnblock = async (student: Student) => {
        const action = student.isBlocked ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} ${student.name}?`)) return;

        try {
            await adminAPI.users.update(student._id, {
                isBlocked: !student.isBlocked,
            });
            addToast({
                type: 'success',
                message: `Student ${action}ed successfully!`,
            });
            fetchStudents();
        } catch (error: any) {
            console.error(`Error ${action}ing student:`, error);
            addToast({ type: 'error', message: `Failed to ${action} student` });
        }
    };

    const handleViewEnrollments = (student: Student) => {
        setSelectedStudent(student);
        setIsEnrollmentModalOpen(true);
    };

    const handleDownloadList = () => {
        try {
            // Create CSV content
            const headers = ['Name', 'Email', 'Status', 'Enrollments', 'Joined Date'];
            const rows = students.map((student) => [
                student.name,
                student.email,
                student.isBlocked ? 'Blocked' : 'Active',
                student.enrollments?.length || 0,
                new Date(student.createdAt).toLocaleDateString(),
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.join(',')),
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            addToast({ type: 'success', message: 'Student list downloaded successfully!' });
        } catch (error) {
            console.error('Error downloading list:', error);
            addToast({ type: 'error', message: 'Failed to download student list' });
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
    };

    const activeStudents = students.filter((s) => !s.isBlocked).length;
    const blockedStudents = students.filter((s) => s.isBlocked).length;
    const totalEnrollments = students.reduce((sum, s) => sum + (s.enrollments?.length || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage student accounts and enrollments
                    </p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Download className="w-5 h-5" />}
                    onClick={handleDownloadList}
                >
                    Download List
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Active Students</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeStudents}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Blocked Students</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{blockedStudents}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalEnrollments}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    {searchTerm && (
                        <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Students Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Enrollments
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Joined Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No students found</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {student.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={student.isBlocked ? 'danger' : 'success'}>
                                                {student.isBlocked ? 'Blocked' : 'Active'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            <button
                                                onClick={() => handleViewEnrollments(student)}
                                                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                <span>{student.enrollments?.length || 0} courses</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewEnrollments(student)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="View Enrollments"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleBlockUnblock(student)}
                                                    className={`${
                                                        student.isBlocked
                                                            ? 'text-green-600 hover:text-green-900 dark:text-green-400'
                                                            : 'text-red-600 hover:text-red-900 dark:text-red-400'
                                                    }`}
                                                    title={student.isBlocked ? 'Unblock' : 'Block'}
                                                >
                                                    {student.isBlocked ? (
                                                        <UserCheck className="w-4 h-4" />
                                                    ) : (
                                                        <UserX className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Enrollment Modal */}
            <Modal
                isOpen={isEnrollmentModalOpen}
                onClose={() => setIsEnrollmentModalOpen(false)}
                title={`${selectedStudent?.name}'s Enrollments`}
                size="lg"
            >
                <div className="p-6">
                    {selectedStudent?.enrollments && selectedStudent.enrollments.length > 0 ? (
                        <div className="space-y-3">
                            {selectedStudent.enrollments.map((enrollment: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {enrollment.courseName || 'Course Name'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="success">Active</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No enrollments yet</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default StudentManagement;
