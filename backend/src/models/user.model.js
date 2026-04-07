import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new Schema(
    {
        fullname: {
            type: String,
            required: true,
            
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            time: true,
        },
        age: {
            type: Number,
            required: true,
        },
        phoneno: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "password is required"],
        },
        refreshToken: {
            type: String,
        }

    },
    {
        timestamps: true
    }
);

// password hashing/encyprt
userSchema.pre("save" , async function (){
    if(!this.isModified("password")){
        return;
    }
    this.password = await bcrypt.hash(this.password , 10);

})


// password decrypting
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password);
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN,
        {
          expiresIn: process.env.ACCESS_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
           _id: this._id,
        },
        process.env.REFRESH_TOKEN,
        {
            expiresIn: process.env.REFRESH_EXPIRY
        }
    )
}


const User = mongoose.model("User" , userSchema);
export default User;



