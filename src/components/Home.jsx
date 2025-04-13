"use client";

import { motion } from "framer-motion";
import useAuthStore from "../stores/authStore";
import AuthCard from "./AuthCard";
import { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {ThreeDot} from "react-loading-indicators";

export default function HomePage() {
    const { user } = useAuthStore();
    const [userHistory, setUserHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/users/getHistory?id=${user?.sub}`);
                const data = await res.json();
                setUserHistory(data.history || []);
            } catch (error) {
                console.error("Не вдалося отримати історію користувача", error);
            }
        };

        fetchHistory().then(() => console.log("success"));
    }, [user]);

    const recommendedVideos = useMemo(() => {
        const videos = [];
        for (const entry of userHistory) {
            const result = entry.result;
            for (const category in result) {
                videos.push(...result[category]);
            }
            if (videos.length >= 5) break;
        }
        return videos.slice(0, 5);
    }, [userHistory]);

    const randomChannels = useMemo(() => {
        const channelsMap = new Map();
        for (const video of recommendedVideos) {
            if (video?.channel && !channelsMap.has(video.channel)) {
                channelsMap.set(video.channel, video);
            }
            if (channelsMap.size >= 5) break;
        }
        return Array.from(channelsMap.values());
    }, [recommendedVideos]);

    return (
        <motion.div
            className="has-background-light p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ minHeight: "100vh" }}
        >
            <div className="is-flex is-justify-content-center container">
                {user ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ minHeight: "100vh" }}
                        className="container py-6"
                    >
                        {userHistory.length !== 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                                <h2 className="title is-4 mb-3">🎬 Рекомендовані канали</h2>
                                <Swiper
                                    slidesPerView={4}
                                    breakpoints={{
                                        640: {
                                            slidesPerView: 7,
                                        },
                                        1024: {
                                            slidesPerView: 10,
                                        },
                                    }}
                                    className="mb-6"
                                >
                                    {randomChannels.map((video, index) => (
                                        <SwiperSlide key={index}>
                                            <div className="p-3 is-grid is-justify-content-center is-align-content-center">
                                                <a href={video.linkChannel} target="_blank" rel="noreferrer">
                                                    <div className="is-flex is-justify-content-center is-align-content-center">
                                                        <img style={{borderRadius: '50%', height: '64px', width: '64px'}}
                                                             src={video.imageAvatar} alt={video.channel}/>
                                                    </div>
                                                    <p className="mt-2 has-text-weight-semibold has-text-centered">{video.channel}</p>
                                                </a>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                <h2 className="title is-4 mb-3">📺 Рекомендовані відео</h2>
                                <Swiper
                                    slidesPerView={2}
                                    breakpoints={{
                                        640: {
                                            slidesPerView: 2,
                                        },
                                        1024: {
                                            slidesPerView: 4,
                                        },
                                    }}
                                >
                                    {recommendedVideos.map((video, index) => (
                                        <SwiperSlide key={index}>
                                            <div className="p-3">
                                                <a href={video.link} target="_blank" rel="noreferrer">
                                                    <img src={video.image} alt={video.title}/>
                                                    <p className="mt-2">{video.title}</p>
                                                </a>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </motion.div>
                        ) : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="is-flex is-justify-content-center"><ThreeDot color="red" size="large" text="" textColor="" /></motion.div>}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ minHeight: "100vh" }}
                        className="pt-6"
                    >
                        <AuthCard/>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
