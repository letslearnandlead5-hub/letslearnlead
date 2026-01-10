import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    onView?: (row: any) => void;
    loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
    columns,
    data,
    onEdit,
    onDelete,
    onView,
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {column.label}
                            </th>
                        ))}
                        {(onEdit || onDelete || onView) && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            {columns.map((column) => (
                                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                                </td>
                            ))}
                            {(onEdit || onDelete || onView) && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        {onView && (
                                            <button
                                                onClick={() => onView(row)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(row)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(row)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
