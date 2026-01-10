import React, { useState } from 'react';
import { X, Upload, File, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import MarkdownViewer from './MarkdownViewer';

interface NoteFormProps {
    initialData?: {
        title: string;
        description: string;
        markdownContent?: string;
        courseId?: string;
        fileType: string;
        category?: string;
        tags?: string[];
    };
    courses?: Array<{ _id: string; title: string }>;
    onSubmit: (noteData: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isFullPage?: boolean; // New prop to control layout
}

const NoteForm: React.FC<NoteFormProps> = ({
    initialData,
    courses = [],
    onSubmit,
    onCancel,
    isLoading = false,
    isFullPage = false,
}) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        markdownContent: initialData?.markdownContent || '',
        courseId: initialData?.courseId || '',
        fileType: initialData?.fileType || 'markdown',
        category: initialData?.category || '',
        tags: initialData?.tags || [],
    });

    const [tagInput, setTagInput] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [contentType, setContentType] = useState<'markdown' | 'file'>('markdown');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'image/jpeg',
                'image/png',
                'image/jpg'
            ];
            
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload a valid file (PDF, DOC, DOCX, TXT, or Image)');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            setUploadedFile(file);
            setFilePreview(file.name);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFilePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (contentType === 'file' && uploadedFile) {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('courseId', formData.courseId);
            formDataToSend.append('fileType', 'file');
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', JSON.stringify(formData.tags));
            formDataToSend.append('file', uploadedFile);
            
            onSubmit(formDataToSend);
        } else {
            // Submit markdown content
            onSubmit({ ...formData, fileType: 'markdown' });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className={isFullPage ? "px-6 py-4" : "max-h-[70vh] overflow-y-auto px-6 py-4"}>
                <div className="space-y-4">
                    {/* Title */}
                    <Input
                        label="Note Title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        placeholder="Enter note title"
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Brief description of the note"
                            required
                        />
                    </div>

                    {/* Course Selection */}
                    {courses.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Course
                            </label>
                            <select
                                value={formData.courseId}
                                onChange={(e) => handleChange('courseId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select a course</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Category */}
                    <Input
                        label="Category (Optional)"
                        type="text"
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="e.g., Study Guide, Summary, Lecture Notes"
                    />

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tags (Optional)
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Add tag and press Enter"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                                Add
                            </Button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Content Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="contentType"
                                    value="markdown"
                                    checked={contentType === 'markdown'}
                                    onChange={() => setContentType('markdown')}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Write Markdown</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="contentType"
                                    value="file"
                                    checked={contentType === 'file'}
                                    onChange={() => setContentType('file')}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Upload File</span>
                            </label>
                        </div>
                    </div>

                    {/* Markdown Content */}
                    {contentType === 'markdown' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Content (Markdown)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="text-sm text-primary-600 hover:underline"
                                >
                                    {isPreview ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                            {isPreview ? (
                                <div className="min-h-[200px] max-h-[300px] overflow-y-auto p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                                    <MarkdownViewer content={formData.markdownContent} />
                                </div>
                            ) : (
                                <textarea
                                    value={formData.markdownContent}
                                    onChange={(e) => handleChange('markdownContent', e.target.value)}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                    placeholder="# Your Note Title

Write your content here using markdown...

**Bold text** and *italic text*

- List item 1
- List item 2

```
Code block
```"
                                />
                            )}
                        </div>
                    )}

                    {/* File Upload */}
                    {contentType === 'file' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Upload File
                            </label>
                            
                            {!uploadedFile ? (
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                PDF, DOC, DOCX, TXT, or Images (Max 10MB)
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                                <File className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {filePreview}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? 'Saving...' : initialData ? 'Update Note' : 'Create Note'}
                </Button>
            </div>
        </form>
    );
};

export default NoteForm;
