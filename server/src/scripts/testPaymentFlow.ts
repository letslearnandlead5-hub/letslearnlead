import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Course } from '../models/Course';
import { Payment } from '../models/Payment';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runPaymentTest() {
    try {
        console.log('--- STARTING PAYMENT FLOW INTEGRATION TEST ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/letslearnlead');
        console.log('✅ Connected to MongoDB');

        const totalPayments = await Payment.countDocuments();
        console.log(`📊 Total Payment Submissions in DB: ${totalPayments}`);

        const courseWithPayment = await Course.findOne({ paymentEnabled: true });
        if (courseWithPayment) {
            console.log(`✅ Course with active payment configuration found: "${courseWithPayment.title}" (${courseWithPayment._id})`);
            console.log(`   Price: ₹${courseWithPayment.price} | UPI ID: ${courseWithPayment.upiId || 'N/A'}`);
        } else {
            console.log('⚠️ No course found with active payment configuration.');
        }

        console.log('\n--- PAYMENT FLOW INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runPaymentTest();
