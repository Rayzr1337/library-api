import mongoose, { model, Schema } from 'mongoose';

export interface IBorrowRecord {
    book: mongoose.Types.ObjectId,
    user: mongoose.Types.ObjectId,
    borrowDate: Date,
    returnDate: Date | null
};

const borrowSchema = new Schema<IBorrowRecord> ({
    book: { type: Schema.Types.ObjectId, required: true, ref: 'Book' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

borrowSchema.index({ book: 1, user: 1 }, { unique: true });
const Borrow = model<IBorrowRecord>('Borrow', borrowSchema);

export default Borrow;

