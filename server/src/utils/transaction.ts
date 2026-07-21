import mongoose, { ClientSession } from 'mongoose';

/**
 * Production-ready MongoDB Transaction Helper
 * 
 * Safely executes database operations within an ACID transaction if running
 * on a MongoDB Replica Set (or MongoDB Atlas). If running on a standalone
 * development MongoDB server where transactions are not supported, it cleanly
 * executes operations without throwing replica set errors.
 * 
 * @param workFn Function receiving optional ClientSession to include in Mongoose calls
 */
export async function withTransaction<T>(
    workFn: (session: ClientSession | null) => Promise<T>
): Promise<T> {
    const conn = mongoose.connection;

    // Check if session can be initialized
    let session: ClientSession | null = null;
    try {
        session = await conn.startSession();
    } catch {
        session = null;
    }

    if (!session) {
        // Standalone mode: execute directly without session
        return workFn(null);
    }

    try {
        let result: T;
        let isTransactionSupported = true;

        try {
            session.startTransaction();
            result = await workFn(session);
            await session.commitTransaction();
        } catch (err: any) {
            // Check if error is due to standalone MongoDB lacking replica set
            if (
                err.message?.includes('Transaction numbers are only allowed') ||
                err.message?.includes('replica set')
            ) {
                isTransactionSupported = false;
                await session.abortTransaction().catch(() => {});
            } else {
                await session.abortTransaction().catch(() => {});
                throw err;
            }
        }

        if (!isTransactionSupported) {
            // Fallback for standalone MongoDB: execute directly without transaction session
            return await workFn(null);
        }

        return result!;
    } finally {
        await session.endSession().catch(() => {});
    }
}
