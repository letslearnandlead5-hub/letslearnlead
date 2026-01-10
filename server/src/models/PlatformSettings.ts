import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
    emailNotifications: boolean;
    maintenanceMode: boolean;
    userRegistration: boolean;
    updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
    {
        emailNotifications: {
            type: Boolean,
            default: true,
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        userRegistration: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const PlatformSettings = mongoose.models.PlatformSettings || 
    mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
