import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const createAdminAccount = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@letslearnandlead.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin account already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.name);
            console.log('\nIf you want to reset the password, delete this user first and run the script again.');
            process.exit(0);
        }

        // Create admin account
        const adminPassword = 'Admin@12345'; // Change this to a secure password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({
            name: 'Admin',
            email: 'admin@letslearnandlead.com',
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true,
            phone: '',
            enrolledCourses: []
        });

        console.log('\n🎉 Admin account created successfully!');
        console.log('=====================================');
        console.log('Email:', admin.email);
        console.log('Password:', adminPassword);
        console.log('Role:', admin.role);
        console.log('=====================================');
        console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
        console.log('⚠️  You can delete this script after running it for security.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error);
        process.exit(1);
    }
};

// Run the script
createAdminAccount();
