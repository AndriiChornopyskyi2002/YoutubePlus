"use client";
import { motion } from "framer-motion";
import Sign from "./Sign";

export default function PageProfile() {
    return (
        <motion.main
            className="has-background-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ minHeight: "100vh" }}
        >
            <div className="container p-6 is-flex is-justify-content-center">
                <Sign/>
            </div>
        </motion.main>
    );
}