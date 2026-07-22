import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Note } from '../models/Note';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function resolveNoteFilePath(fileUrl?: string): string | null {
    if (!fileUrl) return null;
    let cleanPath = fileUrl.replace(/^https?:\/\/[^\/]+/, '');
    if (cleanPath.startsWith('/public')) cleanPath = cleanPath.replace('/public', '');

    const candidates = [
        path.join(__dirname, '../../public', cleanPath),
        path.join(__dirname, '../../public/notes', path.basename(cleanPath)),
        path.join(process.cwd(), 'public', cleanPath),
        path.join(process.cwd(), 'public/notes', path.basename(cleanPath)),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

async function auditNotesStorage() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';
    console.log(`[NOTES AUDIT] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[NOTES AUDIT] Connected successfully.');

    const notes = await Note.find({ status: 'active' });
    console.log(`[NOTES AUDIT] Found ${notes.length} active notes in database.\n`);

    let validCount = 0;
    let missingCount = 0;
    let legacyFixedCount = 0;

    const report: Array<{
        noteId: string;
        title: string;
        fileType: string;
        storedFileUrl: string;
        resolvedDiskPath: string;
        status: 'OK' | 'MISSING_FILE' | 'LEGACY_FIXED';
    }> = [];

    for (const note of notes) {
        if (note.fileType === 'html') {
            report.push({
                noteId: note._id.toString(),
                title: note.title,
                fileType: 'html',
                storedFileUrl: 'N/A (Markdown)',
                resolvedDiskPath: 'N/A (Inline HTML)',
                status: 'OK',
            });
            validCount++;
            continue;
        }

        const resolved = resolveNoteFilePath(note.fileUrl);
        let status: 'OK' | 'MISSING_FILE' | 'LEGACY_FIXED' = 'OK';

        if (note.fileUrl && note.fileUrl.startsWith('http')) {
            const cleanUrl = note.fileUrl.replace(/^https?:\/\/[^\/]+/, '');
            note.fileUrl = cleanUrl;
            await note.save();
            status = 'LEGACY_FIXED';
            legacyFixedCount++;
        }

        if (resolved) {
            validCount++;
            report.push({
                noteId: note._id.toString(),
                title: note.title,
                fileType: note.fileType,
                storedFileUrl: note.fileUrl || '',
                resolvedDiskPath: resolved,
                status,
            });
        } else {
            status = 'MISSING_FILE';
            missingCount++;
            report.push({
                noteId: note._id.toString(),
                title: note.title,
                fileType: note.fileType,
                storedFileUrl: note.fileUrl || '',
                resolvedDiskPath: 'NOT FOUND ON DISK',
                status,
            });
        }
    }

    console.log('=================== NOTES FILE STORAGE AUDIT REPORT ===================');
    console.table(report);
    console.log('========================================================================');
    console.log(`[AUDIT COMPLETE] Total: ${notes.length} | Valid: ${validCount} | Missing: ${missingCount} | Legacy Fixed: ${legacyFixedCount}\n`);

    await mongoose.disconnect();
}

auditNotesStorage().catch((err) => {
    console.error('[NOTES AUDIT FAILED]', err);
    process.exit(1);
});
