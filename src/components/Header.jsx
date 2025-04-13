"use client";
import Link from 'next/link';
import Image from "next/image";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";

export default function Header() {
    const pathname = usePathname();
    const [isActive, setIsActive] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024); // breakpoint для мобілки
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleMenu = () => setIsActive(!isActive);

    const router = useRouter();

    const { user } = useAuthStore();

    return (
        <header style={{ borderBottom: '1px solid black' }} className="navbar is-light">
            <div style={{height: '51px'}} className="container px-2">
                <div className="navbar-brand">
                    <Link style={{textDecoration: 'none', background: 'none'}} href="/" className='navbar-item p-0 pr-6' onClick={() => setIsActive(false)}>
                        <b>YoutubePlus</b>
                        <Image src="/img/logo.png" alt="Logo" width={45} height={35} />
                    </Link>
                    {isMobile && (
                        <button
                            className={`navbar-burger has-text-black ${isActive ? "is-active" : ""}`}
                            aria-label="menu"
                            aria-expanded={isActive}
                            onClick={toggleMenu}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    )}
                </div>

                {/* Десктоп меню */}
                {!isMobile && (
                    <div className="navbar-menu is-active">
                        <div className="navbar-start">
                            <Link href="/" style={{ color: pathname === '/' ? 'red' : 'black' }} className="navbar-item">
                                Головна
                            </Link>
                            <Link href="/search" style={{ color: pathname === '/search' ? 'red' : 'black' }} className="navbar-item">
                                Пошук
                            </Link>
                            <Link href="/history" style={{ color: pathname === '/history' ? 'red' : 'black' }} className="navbar-item">
                                Історія
                            </Link>
                        </div>
                        <div className="navbar-end">
                            <button
                                onClick={() => router.push("/profile")}
                                className="navbar-item"
                            >
                                <AnimatePresence mode="wait">
                                    {!user ? (
                                        <motion.i
                                            key="user-icon"
                                            style={{ color: pathname === "/profile" ? "red" : "black" }}
                                            className="fas fa-user fa-lg"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                        ></motion.i>
                                    ) : (
                                        <motion.p
                                            key="user-email"
                                            style={{ color: pathname === "/profile" ? "red" : "black" }}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {user.email.split("@")[0]}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                )}

                {/* Мобільне меню */}
                <AnimatePresence>
                    {isMobile && isActive && (
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                            className="navbar-menu is-active p-0"
                        >
                            <div className="navbar-start">
                                <Link href="/" style={{color: pathname === '/' ? 'red' : 'black'}}
                                      className="navbar-item" onClick={() => setIsActive(false)}>
                                    Головна
                                </Link>
                                <Link href="/search" style={{color: pathname === '/search' ? 'red' : 'black'}}
                                      className="navbar-item" onClick={() => setIsActive(false)}>
                                    Пошук
                                </Link>
                                <Link href="/history" style={{color: pathname === '/history' ? 'red' : 'black'}}
                                      className="navbar-item" onClick={() => setIsActive(false)}>
                                    Історія
                                </Link>
                            </div>
                            <hr className="m-0"/>
                            <div className="navbar-end">
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="navbar-item"
                                >
                                    {!user ? (
                                        <i style={{color: pathname === "/profile" ? "red" : "black"}} className="fas fa-user fa-lg"></i>
                                    ) : (
                                        <p style={{color: pathname === "/profile" ? "red" : "black"}}>{user.email.split("@")[0]}</p>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}