import mongoose from 'mongoose';

const userEconomySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    lastFish: { type: Date, default: null }
}, { timestamps: true });

userEconomySchema.index({ userId: 1, guildId: 1 }, { unique: true });
userEconomySchema.index({ guildId: 1, wallet: -1 });

const UserEconomy = mongoose.model('UserEconomy', userEconomySchema);
export default UserEconomy;
