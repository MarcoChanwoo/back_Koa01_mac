import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new Schema({
    username: String,
    hashedPassword: String,
});

UserSchema.methods.setPassword = async function (password) {
    // 인스턴스 메서드
    const hash = await bcrypt.hash(password, 10);
    this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
    // 인스턴스 메서드
    const result = await bcrypt.compare(password, this.hashedPassword);
    return result; // true / false
};

UserSchema.statics.findByUsername = function (username) {
    // 스태틱 매서드
    return this.findOne({ username });
};

const User = mongoose.model('User', UserSchema);
export default User;
