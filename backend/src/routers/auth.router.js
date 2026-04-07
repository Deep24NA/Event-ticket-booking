import { Router } from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/auth.controller.js";
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();


router.post("/register", registerUser);


router.post("/login", loginUser);

router.get("/profile" , verifyJWT , getUserProfile );

export default router;