import Header from "../components/Header";
import Footer from "../components/Footer";
import '@fortawesome/fontawesome-free/css/all.min.css';
import './main.sass';

export const metadata = {
  title: "Youtube+",
  description: "Enjoy searching and watching videos from your favorite YouTubers",
};

import {GoogleOAuthProvider} from "@react-oauth/google";
import React from "react";

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
          <Header/>
            {children}
          <Footer/>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}