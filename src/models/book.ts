import { model, Schema } from 'mongoose';

export interface IBook {
    id: string,
    name: string,
    author: string,
    category: string,
    description: string,
    cover: string,
    available: boolean
};

const bookSchema = new Schema<IBook> ({
    id: { type: String, required: true, unique: true },
    name : { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    cover: { type: String, required: true },
    available: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

const Book = model<IBook>("Book" ,bookSchema);

export default Book;


