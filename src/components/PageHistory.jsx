"use client";

import {motion} from "framer-motion";
import useAuthStore from "../stores/authStore";
import AuthCard from "./AuthCard";
import {useEffect, useState} from "react";
import {Pie} from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Accordion, AccordionItem } from '@szhsin/react-accordion';
import ReactPaginate from 'react-paginate';
import {ThreeDot} from "react-loading-indicators";

export default function PageHistory() {
    const { user } = useAuthStore();

    let [loading, setLoading] = useState(true);
    const [userHistory, setUserHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/users/getHistory?id=${user?.sub}`);
                const data = await res.json();
                console.log(data);
                setUserHistory(data.history || []);
            } catch (error) {
                console.error("Не вдалося отримати історію користувача", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory().then(() => console.log("success"));
    }, [user]);

    useEffect(() => {
        ChartJS.register(ArcElement, Tooltip, Legend);
    }, []);

    const [activeTabs, setActiveTabs] = useState([]);

    // Ініціалізація стейту для активних вкладок кожного елемента
    useEffect(() => {
        // Ініціалізація активної вкладки для кожного елемента (початково "videos")
        setActiveTabs(userHistory.map(() => 'videos'));
    }, [userHistory]); // Зміни стейту відбудуться при зміні userHistory

    // Функція для зміни активної вкладки для конкретного елемента
    const handleTabChange = (index, tab) => {
        const updatedTabs = [...activeTabs];
        updatedTabs[index] = tab;
        setActiveTabs(updatedTabs);
    };

    // Встановлюємо стан для поточної сторінки пагінації
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    // Функція для обробки зміни сторінки
    const handlePageChange = ({ selected }) => {
        setCurrentPage(selected);
    };

    // Розбиваємо історію на сторінки
    const paginatedHistory = userHistory.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <motion.div className="has-background-light p-5" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.5}} style={{minHeight: '100vh'}}>
            <div className="is-flex is-justify-content-center container">
                {!loading ? (
                    <div className="mt-6">
                    {user ? (<motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{duration: 0.5, ease: 'easeInOut'}}>
                        {userHistory.length !== 0 ? (
                            <div>
                                <Accordion transition transitionTimeout={300}>
                                    {paginatedHistory.map((entry, index) => {
                                        const categoryCounts = {};
                                        const result = entry.result;

                                        // Обчислюємо кількість відео по категоріям
                                        for (const category in result) {
                                            categoryCounts[category] = result[category].length;
                                        }

                                        const chartData = {
                                            labels: Object.keys(categoryCounts),
                                            datasets: [
                                                {
                                                    label: 'Кількість відео',
                                                    data: Object.values(categoryCounts),
                                                    backgroundColor: [
                                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                                                        '#C9CBCF', '#F67019', '#00A6B4', '#58508D', '#FFA07A',
                                                    ],
                                                    borderWidth: 1,
                                                },
                                            ],
                                        };

                                        return (
                                            <div className="card has-background-white" key={index}
                                                 style={{marginBottom: '2rem', width: '100%'}}>
                                                <AccordionItem
                                                    style={{maxWidth: '444px'}}
                                                    key={index}
                                                    header={<>Категорії: {entry.categories}
                                                        <br/> — <br/> {new Date(entry.timestamp).toLocaleString()}</>}
                                                    className="mb-4 p-5 has-text-centered"
                                                    buttonProps={{className: 'accordion-btn'}}
                                                    contentProps={{className: 'accordion-content'}}
                                                >
                                                    {/* Таби */}
                                                    <div className="tabs is-toggle is-fullwidth m-0 mt-5">
                                                        <ul>
                                                            <li className={activeTabs[index] === 'videos' ? 'is-active' : ''}>
                                                                <a style={{borderRadius: 0}}
                                                                   onClick={() => handleTabChange(index, 'videos')}>
                                                                    <span>🎥 Відео</span>
                                                                </a>
                                                            </li>
                                                            <li className={activeTabs[index] === 'chart' ? 'is-active' : ''}>
                                                                <a style={{borderRadius: 0}}
                                                                   onClick={() => handleTabChange(index, 'chart')}>
                                                                    <span>📊 Діаграма</span>
                                                                </a>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Контент вкладки */}
                                                    <div style={{maxWidth: '444px'}} className="card-content p-0">
                                                        {activeTabs[index] === 'chart' && (
                                                            <div className="content mt-5">
                                                                <Pie data={chartData}/>
                                                            </div>
                                                        )}

                                                        {activeTabs[index] === 'videos' && (
                                                            <div style={{height: '420px', overflow: 'auto'}}
                                                                 className="content">
                                                                {Object.entries(result).map(([category, videos], catIndex) => (
                                                                    <div key={catIndex}
                                                                         style={{marginTop: '1.5rem'}}>
                                                                        <h4 className="title is-5 has-text-left">Категорія: {category}</h4>
                                                                        <div className="columns is-multiline">
                                                                            {videos.length > 0 ? (
                                                                                videos.map((video, vidIndex) => (
                                                                                    <div
                                                                                        className="column is-full-mobile is-half-tablet"
                                                                                        key={vidIndex}>
                                                                                        <div
                                                                                            className="box has-background-light"
                                                                                            style={{
                                                                                                height: '100%',
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column'
                                                                                            }}>
                                                                                            <a href={video.link}>
                                                                                                <figure
                                                                                                    className="image is-4by3">
                                                                                                    <img
                                                                                                        src={video.imageAvatar}
                                                                                                        alt={video.title}/>
                                                                                                </figure>
                                                                                                <h6 className="title is-6"
                                                                                                    style={{marginTop: '0.5rem'}}>
                                                                                                    {video.title}
                                                                                                </h6>
                                                                                            </a>
                                                                                            <a href={video.linkChannel}>
                                                                                                <h6 className="title is-6"
                                                                                                    style={{marginTop: '0.5rem'}}>
                                                                                                    {video.nameChannel}
                                                                                                </h6>
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="column is-full">
                                                                                    <p>В цій категорії немає
                                                                                        відео.</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <hr/>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionItem>
                                            </div>
                                        );
                                    })}
                                </Accordion>

                                {/* Пагінація */}
                                <ReactPaginate
                                    previousLabel="Назад"
                                    nextLabel="Вперед"
                                    pageCount={Math.ceil(userHistory.length / itemsPerPage)}
                                    pageRangeDisplayed={3}
                                    marginPagesDisplayed={2}
                                    onPageChange={handlePageChange}
                                    containerClassName="pagination is-centered"
                                    activeClassName="is-active"
                                    disabledClassName="is-disabled"
                                />
                            </div>
                        ) : <div className="pt-6 is-display-flex is-justify-content-center"><h2>Немає записів</h2></div>}</motion.div>) : (<AuthCard/>)}
                </div>) : <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.5}} className="is-flex is-justify-content-center pt-6"><ThreeDot color="red" size="large" text="" textColor=""/></motion.div>}
            </div>
        </motion.div>
    );
}