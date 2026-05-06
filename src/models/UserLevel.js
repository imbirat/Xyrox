import mongoose from 'mongoose';

const userLevelSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    lastXPTime: { type: Date, default: null },
    lastVoiceJoin: { type: Date, default: null }
}, { timestamps: true });

userLevelSchema.index({ userId: 1, guildId: 1 }, { unique: true });
userLevelSchema.index({ guildId: 1, totalXP: -1 });

export function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level));
}

const UserLevel = mongoose.model('UserLevel', userLevelSchema);
export default UserLevel;
