import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit2,
    Save,
    X,
    Camera,
    GraduationCap,
    BookOpen,
    Lock
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

const MyProfile: React.FC = () => {
    const { user } = useAuthStore();
    const { addToast } = useToastStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
    });

    const [educationData, setEducationData] = useState({
        grade: '',
        stream: '',
        subjectInterests: [] as string[],
        institution: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zipCode || '',
            });
            setEducationData({
                grade: user.grade || '',
                stream: user.stream || '',
                subjectInterests: user.subjectInterests || [],
                institution: user.institution || '',
            });
            // Load existing profile photo
            if (user.profilePicture) {
                setProfilePhoto(user.profilePicture);
            }
        }
    }, [user]);

    const handleFormChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
    };

    const handleEducationChange = (field: string, value: string | string[]) => {
        setEducationData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                addToast({ type: 'error', message: 'File size must be less than 5MB' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePhoto = async () => {
        if (!profilePhoto) {
            addToast({ type: 'error', message: 'No photo to save' });
            return;
        }

        setLoading(true);
        try {
            const authStorage = localStorage.getItem('auth-storage');
            let token = null;
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    token = parsed?.state?.token;
                } catch (e) {
                    console.error('Failed to parse auth-storage:', e);
                }
            }

            if (!token) {
                addToast({ type: 'error', message: 'Session expired. Please login again.' });
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    profilePicture: profilePhoto,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 401) {
                    addToast({ type: 'error', message: 'Session expired. Please login again.' });
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.message || 'Failed to save photo');
            }

            const data = await response.json();
            if (data.user) {
                useAuthStore.getState().updateUser(data.user);
            }
            addToast({ type: 'success', message: 'Profile photo saved successfully!' });
        } catch (error: any) {
            console.error('Error saving photo:', error);
            addToast({ type: 'error', message: error.message || 'Failed to save photo' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePhoto = async () => {
        setLoading(true);
        try {
            const authStorage = localStorage.getItem('auth-storage');
            let token = null;
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    token = parsed?.state?.token;
                } catch (e) {
                    console.error('Failed to parse auth-storage:', e);
                }
            }

            if (!token) {
                addToast({ type: 'error', message: 'Session expired. Please login again.' });
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    profilePicture: '',
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 401) {
                    addToast({ type: 'error', message: 'Session expired. Please login again.' });
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.message || 'Failed to delete photo');
            }

            const data = await response.json();
            if (data.user) {
                useAuthStore.getState().updateUser(data.user);
            }
            setProfilePhoto('');
            addToast({ type: 'success', message: 'Profile photo deleted successfully!' });
        } catch (error: any) {
            console.error('Error deleting photo:', error);
            addToast({ type: 'error', message: error.message || 'Failed to delete photo' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectToggle = (subject: string) => {
        setEducationData((prev) => ({
            ...prev,
            subjectInterests: prev.subjectInterests.includes(subject)
                ? prev.subjectInterests.filter((s: string) => s !== subject)
                : [...prev.subjectInterests, subject],
        }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // Get token from Zustand persist storage (auth-storage)
            const authStorage = localStorage.getItem('auth-storage');

            let token = null;
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    token = parsed?.state?.token;
                } catch (e) {
                    console.error('Failed to parse auth-storage:', e);
                }
            }

            // Validate token exists
            if (!token) {
                addToast({ type: 'error', message: 'Session expired. Please login again.' });
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    profilePicture: profilePhoto,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    grade: educationData.grade,
                    stream: educationData.stream,
                    institution: educationData.institution,
                    subjectInterests: educationData.subjectInterests,
                }),
            });

            if (!response.ok) {
                const data = await response.json();

                // If unauthorized, clear storage and redirect to login
                if (response.status === 401) {
                    addToast({ type: 'error', message: 'Session expired. Please login again.' });
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }

                throw new Error(data.message || 'Failed to update profile');
            }

            const data = await response.json();
            addToast({ type: 'success', message: 'Profile updated successfully!' });
            setIsEditing(false);

            // Update auth store with new user data
            if (data.user) {
                useAuthStore.getState().updateUser(data.user);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            addToast({ type: 'error', message: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            addToast({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            // Get token from Zustand persist storage (auth-storage)
            const authStorage = localStorage.getItem('auth-storage');

            let token = null;
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    token = parsed?.state?.token;
                } catch (e) {
                    console.error('Failed to parse auth-storage:', e);
                }
            }

            if (!token) {
                addToast({ type: 'error', message: 'Session expired. Please login again.' });
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to change password');
            }

            addToast({ type: 'success', message: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Error changing password:', error);
            addToast({ type: 'error', message: error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Photo */}
                    <Card className="p-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-16 h-16 text-white" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    disabled={loading}
                                >
                                    <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {user?.name || 'Student'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">{user?.email}</p>
                                <Badge variant="primary">Student</Badge>
                                
                                {/* Photo Actions */}
                                {profilePhoto && (
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleSavePhoto}
                                            disabled={loading || profilePhoto === user?.profilePicture}
                                        >
                                            {loading ? 'Saving...' : 'Save Photo'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDeletePhoto}
                                            disabled={loading}
                                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                                        >
                                            Delete Photo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Personal Information */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Personal Information
                            </h2>
                            {!isEditing ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Edit2 className="w-4 h-4" />}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<X className="w-4 h-4" />}
                                        onClick={() => {
                                            setIsEditing(false);
                                            if (user) {
                                                setFormData({
                                                    name: user.name || '',
                                                    email: user.email || '',
                                                    phone: '',
                                                    address: '',
                                                    city: '',
                                                    state: '',
                                                    zipCode: '',
                                                });
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<Save className="w-4 h-4" />}
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                    >
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleFormChange('name', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.name || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <p className="text-gray-900 dark:text-white">{formData.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleFormChange('phone', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.phone || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Member Since
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    N/A
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Address
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleFormChange('address', e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.address || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    City
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleFormChange('city', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.city || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    State
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleFormChange('state', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.state || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ZIP Code
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.zipCode}
                                        onChange={(e) => handleFormChange('zipCode', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{formData.zipCode || 'Not set'}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Education Details */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <GraduationCap className="w-6 h-6 text-primary-600" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Education Details
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Class / Grade
                                </label>
                                {isEditing ? (
                                    <select
                                        value={educationData.grade}
                                        onChange={(e) => handleEducationChange('grade', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Grade</option>
                                        <option value="9th">9th Grade</option>
                                        <option value="10th">10th Grade</option>
                                        <option value="11th">11th Grade</option>
                                        <option value="12th">12th Grade</option>
                                        <option value="undergraduate">Undergraduate</option>
                                        <option value="postgraduate">Postgraduate</option>
                                        <option value="other">Other</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{educationData.grade || 'Not set'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Stream
                                </label>
                                {isEditing ? (
                                    <select
                                        value={educationData.stream}
                                        onChange={(e) => handleEducationChange('stream', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Stream</option>
                                        <option value="science">Science</option>
                                        <option value="commerce">Commerce</option>
                                        <option value="arts">Arts/Humanities</option>
                                        <option value="engineering">Engineering</option>
                                        <option value="medical">Medical</option>
                                        <option value="business">Business</option>
                                        <option value="other">Other</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900 dark:text-white capitalize">{educationData.stream || 'Not set'}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Institution / School
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={educationData.institution}
                                        onChange={(e) => handleEducationChange('institution', e.target.value)}
                                        placeholder="Enter your school or college name"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white">{educationData.institution || 'Not set'}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    <BookOpen className="w-4 h-4 inline mr-2" />
                                    Subject Interests
                                </label>
                                {isEditing ? (
                                    <div className="flex flex-wrap gap-2">
                                        {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Business Studies'].map((subject) => (
                                            <button
                                                key={subject}
                                                type="button"
                                                onClick={() => handleSubjectToggle(subject)}
                                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${educationData.subjectInterests.includes(subject)
                                                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-600'
                                                    : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
                                                    }`}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {educationData.subjectInterests.length > 0 ? (
                                            educationData.subjectInterests.map((subject: string) => (
                                                <Badge key={subject} variant="primary">
                                                    {subject}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-gray-600 dark:text-gray-400">No subjects selected</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Account Settings - Change Password */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-6 h-6 text-primary-600" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Account Settings
                            </h2>
                        </div>
                        <form onSubmit={handleChangePassword}>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Changing...' : 'Change Password'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
