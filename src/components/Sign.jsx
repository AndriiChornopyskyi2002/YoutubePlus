"use client";
import { googleLogout } from "@react-oauth/google";
import useAuthStore from "../stores/authStore";
import { AnimatePresence, motion } from "framer-motion";
import AuthCard from "./AuthCard";

export default function Sign() {
    const { user, logout } = useAuthStore();

    return (
        <motion.div
            className="has-background-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ minHeight: "100vh" }}
        >
            <AnimatePresence mode="wait">
                {user ? (
                    <motion.div
                        key="profile-card"
                        className="card has-background-white"
                        style={{ maxWidth: "600px", width: "100%" }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className="card-content">
                            <h1 className="title is-4 has-text-centered">Вітаю, {user.name}</h1>
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.4 }}
                                className="has-text-centered"
                            >
                                <motion.img
                                    src={user.picture}
                                    alt="User Avatar"
                                    className="image is-128x128"
                                    style={{ display: "block", margin: "0 auto", borderRadius: "5rem" }}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                />
                                <p>Email: {user.email}</p>
                                <motion.button
                                    className="button is-danger mt-4"
                                    onClick={() => {
                                        logout();
                                        googleLogout();
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    Вийти
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <AuthCard />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
