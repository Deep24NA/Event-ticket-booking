import mongoose, {Schema} from "mongoose";

const notificationSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["UPCOMING_EVENT" , "NEW_BID" , "TICKET"],
        },
        isRead: {
            type: Boolean,
            default: false,
        }
    },
    {timestamps: true},
);


const Notification = mongoose.model("Notification" , notificationSchema);
export default Notification;
