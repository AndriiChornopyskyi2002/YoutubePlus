'use client';
import { useGoogleLogin } from "@react-oauth/google";
import { useEffect } from "react";
import useAuthStore from "../stores/authStore";
import { motion } from "framer-motion";

export default function AuthCard() {
    const { user, accessToken, refreshToken, login, refreshAccessToken, setChannels } = useAuthStore();

    // Оновлення токена, якщо він застарів
    useEffect(() => {
        const checkAndRefreshToken = async () => {
            if (!accessToken && refreshToken) {
                console.log("Access token expired. Refreshing...");
                await refreshAccessToken();
            }
        };

        checkAndRefreshToken().then(() => console.log("success"));
    }, [accessToken, refreshToken]);

    useEffect(() => {
        if (accessToken && !user) {
            fetchUserInfo(accessToken).then(() => console.log("User info fetched successfully"));
        }
    }, [accessToken]);

    const fetchYouTubeSubscriptions = async (token) => {
        let allChannels = [];
        let nextPageToken = null;

        try {
            do {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!response.ok) {
                    console.warn("Access token is invalid for YouTube API, refreshing...");
                    await refreshAccessToken(); // Оновлення токена перед повторним запитом
                    return;
                }

                const data = await response.json();
                allChannels = [...allChannels, ...(data.items || [])];
                nextPageToken = data.nextPageToken || null;
            } while (nextPageToken);

            console.log("All Channels:", allChannels);
            setChannels(allChannels);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchYouTubeSubscriptions(accessToken).then(() => console.log("YouTube subscriptions fetched successfully"));
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken && !user) {
            fetchUserInfo(accessToken).then(() => console.log("success"));
        }
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken && refreshToken) {
            refreshAccessToken();
        }
    }, [accessToken, refreshToken]);

    const fetchUserInfo = async (token) => {
        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            login(data, token, refreshToken);

            // Після логіну — синхронізуємо з БД
            await fetch('/api/auth/syncUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: data.sub,
                    email: data.email,
                    name: data.name,
                    picture: data.picture,
                    history: data.history
                }),
            });
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    };

    const googleLogin = useGoogleLogin({
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        onSuccess: (tokenResponse) => {
            login(null, tokenResponse.access_token, tokenResponse.refresh_token);
            fetchUserInfo(tokenResponse.access_token).then(() => console.log("success"));
        },
        onError: () => console.log("Login Failed"),
        flow: "implicit",
    });

    return (
        <motion.div
            className="card has-background-white"
            style={{ maxWidth: "600px", width: "100%" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <div className="card-content">
                <h4 className="title m-0 has-text-centered">Авторизація</h4>
                <h6 className="has-text-centered">Увійдіть, або зареєструйтесь, щоб користуватись продуктом</h6>
                <div className="is-flex is-justify-content-center mt-4">
                    <button style={{ border: "1px solid #dbdbdb" }} className="button is-white" onClick={googleLogin}>
                        <i className="fab fa-google has-text-danger" style={{ marginRight: "8px" }}></i>
                        Вхід/Реєстрація
                    </button>
                </div>
            </div>
        </motion.div>
    );
}