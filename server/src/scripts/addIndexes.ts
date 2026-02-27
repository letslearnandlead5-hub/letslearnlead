import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to add database indexes for better query performance
 * Usage: tsx src/scripts/addIndexes.ts
 */

const addIndexes = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        console.log('📊 Adding indexes to Course collection...');

        // Check existing indexes
        const existingIndexes = await Course.collection.getIndexes();
        console.log('\n📋 Existing indexes:');
        console.log(JSON.stringify(existingIndexes, null, 2));

        // Add compound indexes for common query patterns
        console.log('\n⏳ Creating new indexes...');

        // Index for category + medium queries
        await Course.collection.createIndex(
            { category: 1, medium: 1 },
            { name: 'category_medium_idx', background: true }
        );
        console.log('✅ Created index: category_medium_idx');

        // Index for level + medium queries
        await Course.collection.createIndex(
            { level: 1, medium: 1 },
            { name: 'level_medium_idx', background: true }
        );
        console.log('✅ Created index: level_medium_idx');

        // Index for category + level + medium queries
        await Course.collection.createIndex(
            { category: 1, level: 1, medium: 1 },
            { name: 'category_level_medium_idx', background: true }
        );
        console.log('✅ Created index: category_level_medium_idx');

        // Index for createdAt (for sorting)
        await Course.collection.createIndex(
            { createdAt: -1 },
            { name: 'createdAt_desc_idx', background: true }
        );
        console.log('✅ Created index: createdAt_desc_idx');

        // Check new indexes
        const newIndexes = await Course.collection.getIndexes();
        console.log('\n📋 All indexes after creation:');
        console.log(JSON.stringify(newIndexes, null, 2));

        console.log('\n✅ Index creation complete!');
        console.log('📊 Query performance should be significantly improved.');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error: any) {
        if (error.code === 85) {
            console.log('ℹ️  Index already exists, skipping...');
        } else {
            console.error('❌ Error:', error);
        }
        process.exit(1);
    }
};

addIndexes();
