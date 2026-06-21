import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Smartphone, X, BookOpen, Users, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp, FileQuestion } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AdminHeader from '../../components/admin/AdminHeader';
import { bannerAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  discount: string;
  cta: string;
  image: string;
  bgGradient: [string, string];
  actionType: 'category' | 'course' | 'search';
  actionId?: string;
  actionName?: string;
  actionQuery?: string;
  isActive: boolean;
  order: number;
}

export const BannerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { addToast } = useToastStore();
  const { logout } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    discount: '',
    cta: '',
    image: '',
    bgGradient: ['#667eea', '#764ba2'],
    actionType: 'category' as 'category' | 'course' | 'search',
    actionId: '',
    actionName: '',
    actionQuery: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response: any = await bannerAPI.getAllAdmin();
      if (response.success) {
        setBanners(response.data);
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to fetch banners' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await bannerAPI.update(editingBanner._id, formData);
        addToast({ type: 'success', message: 'Banner updated successfully' });
      } else {
        await bannerAPI.create(formData);
        addToast({ type: 'success', message: 'Banner created successfully' });
      }
      resetForm();
      fetchBanners();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save banner' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await bannerAPI.delete(id);
      addToast({ type: 'success', message: 'Banner deleted successfully' });
      fetchBanners();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to delete banner' });
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await bannerAPI.update(banner._id, { isActive: !banner.isActive });
      addToast({ type: 'success', message: `Banner ${!banner.isActive ? 'activated' : 'deactivated'}` });
      fetchBanners();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to update banner' });
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      discount: banner.discount,
      cta: banner.cta,
      image: banner.image,
      bgGradient: banner.bgGradient,
      actionType: banner.actionType,
      actionId: banner.actionId || '',
      actionName: banner.actionName || '',
      actionQuery: banner.actionQuery || '',
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      discount: '',
      cta: '',
      image: '',
      bgGradient: ['#667eea', '#764ba2'],
      actionType: 'category',
      actionId: '',
      actionName: '',
      actionQuery: '',
      isActive: true,
      order: 0,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleLogout = () => {
    logout();
    addToast({ type: 'success', message: 'Logged out successfully!' });
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, path: '/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/dashboard' },
    { id: 'users', label: 'All Users', icon: Users, path: '/dashboard' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/dashboard' },
    { id: 'notes', label: 'Notes', icon: FileText, path: '/dashboard' },
    { id: 'quizzes', label: 'Quizzes', icon: FileQuestion, path: '/admin/quizzes' },
    { id: 'doubts', label: 'Student Doubts', icon: MessageSquare, path: '/dashboard' },
    { id: 'notifications', label: 'Notifications', icon: Brain, path: '/dashboard' },
    { id: 'banners', label: 'Mobile Banners', icon: Smartphone, path: '/admin/banners' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header - Full Width */}
      <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />

      <div className="flex">
        {/* Sidebar - Responsive and Sticky */}
        <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
          <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 lg:hidden">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(tab.path);
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  tab.id === 'banners'
                    ? 'bg-primary-100 dark:bg-primary-950 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                navigate('/dashboard');
                setShowMobileSidebar(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* Overlay for mobile sidebar */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mobile App Banners
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage promotional banners for the mobile app home screen
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(!showForm)}
          leftIcon={showForm ? undefined : <Plus className="w-5 h-5" />}
        >
          {showForm ? 'Cancel' : 'Add Banner'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Banners</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {banners.length}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {banners.filter(b => b.isActive).length}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <EyeOff className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Inactive</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {banners.filter(b => !b.isActive).length}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {banners.filter(b => b.actionType === 'category').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Master Science"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtitle *
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Get 60% OFF on all courses"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Text *
                </label>
                <input
                  type="text"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="60% OFF"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CTA Button Text *
                </label>
                <input
                  type="text"
                  value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enroll Now"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gradient Color 1 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.bgGradient[0]}
                    onChange={(e) => setFormData({ ...formData, bgGradient: [e.target.value, formData.bgGradient[1]] })}
                    className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.bgGradient[0]}
                    onChange={(e) => setFormData({ ...formData, bgGradient: [e.target.value, formData.bgGradient[1]] })}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="#667eea"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gradient Color 2 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.bgGradient[1]}
                    onChange={(e) => setFormData({ ...formData, bgGradient: [formData.bgGradient[0], e.target.value] })}
                    className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.bgGradient[1]}
                    onChange={(e) => setFormData({ ...formData, bgGradient: [formData.bgGradient[0], e.target.value] })}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="#764ba2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action Type *
                </label>
                <select
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="category">Category</option>
                  <option value="course">Course</option>
                  <option value="search">Search</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
              {formData.actionType === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category ID
                    </label>
                    <input
                      type="text"
                      value={formData.actionId}
                      onChange={(e) => setFormData({ ...formData, actionId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="science, math, english, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={formData.actionName}
                      onChange={(e) => setFormData({ ...formData, actionName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Science, Math, English, etc."
                    />
                  </div>
                </>
              )}
              {formData.actionType === 'course' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course ID
                    </label>
                    <input
                      type="text"
                      value={formData.actionId}
                      onChange={(e) => setFormData({ ...formData, actionId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Course MongoDB ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={formData.actionName}
                      onChange={(e) => setFormData({ ...formData, actionName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Course title"
                    />
                  </div>
                </>
              )}
              {formData.actionType === 'search' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={formData.actionQuery}
                    onChange={(e) => setFormData({ ...formData, actionQuery: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search term"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active (visible in mobile app)
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Banners List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          All Banners
        </h2>

        {banners.length === 0 ? (
          <div className="text-center py-12">
            <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No banners created yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Create your first banner to display in the mobile app
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div
                  className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${banner.bgGradient[0]}, ${banner.bgGradient[1]})`,
                  }}>
                  {banner.discount}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {banner.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {banner.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant={banner.actionType === 'category' ? 'primary' : banner.actionType === 'course' ? 'secondary' : 'warning'}>
                      {banner.actionType}
                    </Badge>
                    <Badge variant="secondary">
                      Order: {banner.order}
                    </Badge>
                    {banner.isActive ? (
                      <Badge variant="success">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        Inactive
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-2">
                      CTA: "{banner.cta}"
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(banner)}
                    title={banner.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner._id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
