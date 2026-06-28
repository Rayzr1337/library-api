import { model, Schema } from 'mongoose';

export interface IUser {
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    isAdmin: boolean
};

const userSchema = new Schema<IUser> ({
    username : { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
}, { 
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: function(doc, ret) {
                delete (ret as any).password;
                return ret; 
            }
    } });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

const User = model<IUser>("User" ,userSchema);

export default User;


