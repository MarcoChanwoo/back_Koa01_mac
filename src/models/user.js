import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import Jwt from 'jsonwebtoken';

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

UserSchema.methods.serialize = function () {
    const data = this.toJSON();
    delete data.hashedPassword;
    return data;
};

UserSchema.methods.generateToken = function () {
    const token = Jwt.sign(
        // 첫번째 파라미터에는 토큰 안에 집어넣고 싶은 데이터를 넣음
        {
            _id: this.id,
            username: this.username,
        },
        process.env.JWT_SECRET, // 두 번째 파라미터에는 JWT 암호를 넣음
        {
            expiresIn: '7d', // 7일간 유효함
        },
    );
    return token;
};

UserSchema.statics.findByUsername = function (username) {
    // 스태틱 매서드
    return this.findOne({ username });
};

const User = mongoose.model('User', UserSchema);
export default User;
