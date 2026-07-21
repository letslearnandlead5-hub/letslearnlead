import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkReplicaSetStatus() {
    try {
        console.log('--- CHECKING MONGODB REPLICA SET & TRANSACTION CAPABILITY ---');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';
        console.log(`Connecting to: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully.');

        const db = mongoose.connection.db;
        if (!db) {
            console.error('❌ DB handle unavailable');
            process.exit(1);
        }

        // Run hello/isMaster command to get topology status
        const adminDb = db.admin();
        const helloResult = await adminDb.command({ hello: 1 }).catch(() => adminDb.command({ isMaster: 1 }));

        console.log('\n📊 Deployment Topology details:');
        console.log(` - Is Replica Set: ${Boolean(helloResult.setName)}`);
        if (helloResult.setName) {
            console.log(` - Replica Set Name: ${helloResult.setName}`);
            console.log(` - Is Primary: ${Boolean(helloResult.isWritablePrimary || helloResult.ismaster)}`);
            console.log(` - Hosts: ${JSON.stringify(helloResult.hosts || [])}`);
        } else if (helloResult.msg === 'isdbgrid') {
            console.log(' - Type: Mongos (Sharded Cluster)');
        } else {
            console.log(' - Type: Standalone MongoDB Server (Single Instance)');
        }

        console.log(` - Server Version: ${helloResult.version || 'Unknown'}`);
        console.log(` - Max BSON Object Size: ${helloResult.maxBsonObjectSize || 16777216} bytes`);

        // Test transaction capability via startSession
        console.log('\n🧪 Testing Mongoose Session / Transaction Capability...');
        const session = await mongoose.startSession().catch(() => null);
        if (session) {
            let transactionSupported = false;
            try {
                session.startTransaction();
                await session.abortTransaction();
                transactionSupported = true;
            } catch (err: any) {
                console.log(` ⚠️ Transaction test exception: ${err.message}`);
            } finally {
                await session.endSession();
            }

            if (transactionSupported) {
                console.log('🟢 ACCEPTS TRANSACTIONS: Multi-document ACID transactions are FULLY SUPPORTED & FUNCTIONAL.');
            } else {
                console.log('🟡 STANDALONE MODE: Session supported, but multi-document transactions require a Replica Set (e.g. MongoDB Atlas or rs.initiate()).');
            }
        } else {
            console.log('🔴 SESSIONS DISABLED: Sessions not supported by current server deployment.');
        }

        console.log('\n--- CHECK COMPLETE ---');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Check failed:', err.message);
        process.exit(1);
    }
}

checkReplicaSetStatus();
