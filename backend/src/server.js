import dotenv from "dotenv";
dotenv.config({ path: './.env' }); // Or just dotenv.config()
import connectDB from "./db/index.js";
import app from "./app.js";


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () =>{
        console.log(`server is running in Port : ${process.env.PORT}!`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed ", err )
});

