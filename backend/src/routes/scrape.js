import express from "express";
import {getProducts} from "../controllers/scrape.js";


const router = express.Router();

router.get('/', getProducts);

export default router;