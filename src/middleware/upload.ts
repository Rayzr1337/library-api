import multer from 'multer'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Readable } from 'node:stream'
import { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError'


const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed.'))
        }
    }
});

export async function cloudinaryUpload(req: Request, res: Response, next: NextFunction) {
    if (!req.file) throw new AppError("Failed to read book cover image data from buffer!", 500);
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'book-covers' }, 
            (error, result) => {
                if (error) reject(error);
                else resolve(result!);
        });
        Readable.from(req.file!.buffer).pipe(stream);
    }); 
    
    req.body.cover = result.secure_url;
    next();
}
