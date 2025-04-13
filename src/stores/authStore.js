import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            channels: [], // Додаємо список каналів

            login: (userData, token, refreshToken) => {
                set({ user: userData, accessToken: token, refreshToken });
            },

            logout: () => {
                set({ user: null, accessToken: null, refreshToken: null, channels: [] });
            },

            refreshAccessToken: async () => {
                const refreshToken = get().refreshToken;

                if (!refreshToken) {
                    console.error("No refresh token found!");
                    return;
                }

                try {
                    const response = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        body: new URLSearchParams({
                            client_id: process.env.GOOGLE_CLIENT_ID,
                            client_secret: process.env.GOOGLE_CLIENT_SECRET,
                            refresh_token: refreshToken,
                            grant_type: "refresh_token",
                        }),
                    });
                    const data = await response.json();
                    if (data.access_token) {
                        set({ accessToken: data.access_token });
                    }
                } catch (error) {
                    console.error("Error refreshing access token:", error);
                }
            },

            setChannels: (channels) => {
                set({ channels });
            },
        }),
        {
            name: "auth-storage",
        }
    )
);

export default useAuthStore;