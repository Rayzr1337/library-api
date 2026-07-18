import { model, Schema } from 'mongoose';

export interface IUser {
    username: string,
    email: string,
    password?: string,
    firstName: string,
    lastName: string,
    isAdmin: boolean,
    authProviders: string[],
    GoogleId?: string,
    GitHubId?: string
};

const userSchema = new Schema<IUser> ({
    username : { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    authProviders: { type: [String], default: ['local'] },
    GoogleId: { type: String, required: false },
    GitHubId: { type: String, required: false }
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


