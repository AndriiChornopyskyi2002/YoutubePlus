"use client";
import {AnimatePresence, motion} from "framer-motion";
import {useRef, useState} from "react";
import AuthCard from "./AuthCard";
import useAuthStore from "../stores/authStore";
import Select from "react-select/base";
import makeAnimated from 'react-select/animated';
import OpenAI from "openai";
import {Atom, ThreeDot} from "react-loading-indicators";
import Swal from "sweetalert2";

export default function PageSearch() {
    const { user, channels } = useAuthStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChannels, setSelectedChannels] = useState([]);
    const itemsPerPage = 5;
    const [videos, setVideos] = useState([]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredChannels = channels.filter(channel =>
        channel.snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredChannels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedChannels = filteredChannels.slice(startIndex, startIndex + itemsPerPage);

    const toggleChannelSelection = (channel) => {
        setSelectedChannels(prevSelected => {
            if (prevSelected.includes(channel)) {
                return prevSelected.filter(c => c !== channel);
            } else if (prevSelected.length < 3) {
                return [...prevSelected, channel];
            }
            return prevSelected;
        });
    };

    const videoListRef = useRef(null);
    const mainListRef = useRef(null);

    const fetchVideos = async () => {
        if (selectedChannels.length === 0) return;
        let allVideos = [];

        for (const channel of selectedChannels) {
            const channelId = channel.snippet.resourceId.channelId;
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?key=${process.env.NEXT_PUBLIC_OPENAI_KEY}&channelId=${channelId}&part=snippet&order=date&maxResults=25`
            );
            const data = await response.json();
            allVideos = [...allVideos, ...data.items];
        }

        setVideos(allVideos);
        console.log(videos)

        // Дочекаємось оновлення стану перед скроллом
        setTimeout(() => {
            if (videoListRef.current) {
                videoListRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }, 50);
    };

    const animatedComponents = makeAnimated();

    const categoriesOfVideo = [
       { value: "music", label: "Музика" },
       { value: "sports", label: "Спорт" },
       { value: "movies", label: "Фільми" },
       { value: "news", label: "Новини" },
       { value: "gaming", label: "Ігри" },
       { value: "education", label: "Освіта" }
    ];

    const [selectedOptions, setSelectedOptions] = useState([]);

    const [menuIsOpen, setMenuIsOpen] = useState(false);

    const [inputValue, setInputValue] = useState("");

    const [isFetching, setIsFetching] = useState(false);

    let [nextPage, setNextPage] = useState(false);

    const [sortedVideos, setSortedVideos] = useState({});

    let [loading, setLoading] = useState(true);

    const fetchResponse = async () => {
        if(selectedOptions.length === 0) {
            Swal.fire({
                title: 'Помилка!',
                text: 'Оберіть категорію(ї)',
                icon: 'error',
                confirmButtonColor: 'rgba(220,20,60,0.63)'
            })

            return;
        }

        if (isFetching) return;
        setIsFetching(true);

        if (mainListRef.current) {
            mainListRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }

        setTimeout(() => {
            setNextPage(true);
        }, 300);

        try {
            const client = new OpenAI({
                apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
                dangerouslyAllowBrowser: true, // Увага! Це небезпечно
            });

            const selectedOptionsText = selectedOptions.map(option => option.label).join(", ");
            const message = videos
                .map((video, index) =>
                    `${index + 1}. ${video.snippet.title} 
                    (Канал: ${video.snippet.channelTitle} 
                    Посилання на канал: https://www.youtube.com/channel/${video.snippet.channelId} 
                    Аватарка каналу: ${video.snippet.thumbnails.default.url} 
                    Посилання: https://www.youtube.com/watch?v=${video.id.videoId} 
                    Заставка відео: ${video.snippet.thumbnails.high.url}`
                )
                .join("\n");

            console.log(message);
            const response = await client.responses.create({
                model: "chatgpt-4o-latest",
                input: [
                    { role: "user", content: `!Зауважу, що у відповідь потрібно повертати тільки JSON формат і нічого більше, а також бери до уваги назву каналу, що може автоматично свідчити, що всі відео каналу можуть віднестись до одної категорії! Обрані категорії: ${selectedOptionsText}; Відео з каналів ${message};  Мені потрібно, щоб ти сортував по наданим категоріям відео з каналів і дані передавав мені через json по такій структурі {"Новини": [{"title": "","channel": "","link": "", "image": "", "imageAvatar": "", "linkChannel": "", "nameChannel": ""}],"Ігри": [{"title": "","channel": ","link": "", "image": "", "imageAvatar": "", "linkChannel": "", "nameChannel": ""}...   !якщо нічого не підходить, то всеодно повертай JSON формат, але з пустими значеннями. ! Зауважу, що я лиш навів приклад як має виглядати структура, а не ввів шаблонні данні, тому якщо ти бачиш тільки одну вибрану категорію, то тільки під цю категорію і сортуй і не більше !` },
                ],}
            );

            try {
                // Регулярний вираз для пошуку JSON у тексті
                const jsonMatch = response.output_text.match(/```json([\s\S]*?)```/);

                if (jsonMatch) {
                    const cleanJson = jsonMatch[1].trim(); // Вилучення чистого JSON
                    const jsonData = JSON.parse(cleanJson); // Парсимо JSON
                    setSortedVideos(jsonData);

                    console.log('user.id:', user.sub);
                    console.log('newEntry:', {
                        categories: selectedOptionsText,
                        result: jsonData
                    });


                    await fetch('/api/users/history', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: user.sub,
                            newEntry: {
                                categories: selectedOptionsText,
                                result: jsonData
                            }
                        })
                    });
                } else {
                    console.error("JSON не знайдено в тексті.");
                }
            } catch (error) {
                console.error("Помилка при парсингу JSON:", error);
                setNextPage(false);
                Swal.fire({
                    title: 'Помилка!',
                    text: error,
                    icon: 'error',
                    confirmButtonColor: 'rgba(220,20,60,0.63)'
                })
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setNextPage(false);
            Swal.fire({
                title: 'Помилка!',
                text: error,
                icon: 'error',
                confirmButtonColor: 'rgba(220,20,60,0.63)'
            })
        } finally {
            setIsFetching(false);
            setLoading(false);
        }
    };

    return (
        <motion.main className="has-background-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ minHeight: '100vh' }}>
            <div className="is-flex is-justify-content-center container">
                {!loading ? (
                    <div className="mt-6 mb-6">
                        {user ? (
                            <AnimatePresence>
                                {!nextPage ? (
                                        <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}}
                                                    transition={{duration: 0.5, ease: "easeInOut"}}>
                                            <motion.div ref={mainListRef} className="card has-background-white"
                                                        style={{width: '350px'}} initial={{scale: 0.8, opacity: 0}}
                                                        animate={{scale: 1, opacity: 1}}
                                                        transition={{duration: 0.5, ease: "easeInOut"}}>
                                                <header className="card-header">
                                                    <p className="card-header-title">Канали для пошуку</p>
                                                </header>
                                                <div className="card-content">
                                                    <input
                                                        type="text"
                                                        className="input mb-3 has-background-light"
                                                        placeholder="Пошук каналів..."
                                                        value={searchQuery}
                                                        onChange={handleSearchChange}
                                                    />
                                                    <AnimatePresence>
                                                        {filteredChannels.length === 0 ? (
                                                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                                                                        exit={{opacity: 0}} style={{height: '220px'}}>
                                                                <p className="has-text-centered">Канали не обрані</p>
                                                            </motion.div>
                                                        ) : (
                                                            <ul style={{height: '220px'}}>
                                                                {paginatedChannels.map(channel => (
                                                                    <motion.li key={channel.id} className="mb-2"
                                                                               initial={{opacity: 0, x: -20}}
                                                                               animate={{opacity: 1, x: 0}}
                                                                               exit={{opacity: 0, x: 20}}
                                                                               transition={{duration: 0.3}}>
                                                                        <label className="is-flex is-align-items-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedChannels.includes(channel)}
                                                                                onChange={() => toggleChannelSelection(channel)}
                                                                                disabled={!selectedChannels.includes(channel) && selectedChannels.length >= 5}
                                                                                className="mr-2"
                                                                            />
                                                                            <img
                                                                                src={channel.snippet.thumbnails.default.url}
                                                                                alt={channel.snippet.title} className="mr-2"
                                                                                style={{
                                                                                    borderRadius: "50%",
                                                                                    width: "40px",
                                                                                    height: "40px"
                                                                                }}/>
                                                                            <a href={`https://www.youtube.com/channel/${channel.snippet.resourceId.channelId}`}
                                                                               target="_blank" rel="noopener noreferrer">
                                                                                {channel.snippet.title}
                                                                            </a>
                                                                        </label>
                                                                    </motion.li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <motion.div
                                                    className="card-footer"
                                                    initial={{opacity: 0, y: 20}}
                                                    animate={{opacity: 1, y: 0}}
                                                    exit={{opacity: 0, y: 20}}
                                                    transition={{duration: 0.3}}
                                                >
                                                    <div className="card-footer-item">
                                                        <button className="button has-background-danger"
                                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                disabled={currentPage === 1}>Назад
                                                        </button>
                                                    </div>
                                                    <div className="card-footer-item">
                                                        <span>{currentPage} з {totalPages}</span>
                                                    </div>
                                                    <div className="card-footer-item">
                                                        <button className="button has-background-danger"
                                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                                disabled={currentPage === totalPages}>Вперед
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                            <motion.div className="card has-background-white"
                                                        style={{width: '350px', height: '300.4px'}}
                                                        initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}}
                                                        transition={{duration: 0.5, ease: "easeInOut"}}>
                                                <header className="card-header">
                                                    <p className="card-header-title">Обрані канали</p>
                                                </header>
                                                <div className="card-content">
                                                    <AnimatePresence>
                                                        {selectedChannels.length === 0 ? (
                                                            <motion.p
                                                                style={{height: '140px'}}
                                                                className="has-text-centered"
                                                                initial={{opacity: 0}}
                                                                animate={{opacity: 1}}
                                                                exit={{opacity: 0, scale: 0.9}}
                                                                transition={{duration: 0.3}}
                                                            >
                                                                Канали не знайдено
                                                            </motion.p>
                                                        ) : (
                                                            <div>
                                                                <ul style={{height: '140px'}}>
                                                                    <AnimatePresence>
                                                                        {selectedChannels.map(channel => (
                                                                            <motion.li
                                                                                key={channel.id}
                                                                                className="mb-2"
                                                                                initial={{opacity: 0, x: 20}}
                                                                                animate={{opacity: 1, x: 0}}
                                                                                exit={{opacity: 0, x: -20, scale: 0.9}}
                                                                                transition={{duration: 0.3}}
                                                                            >
                                                                                <label
                                                                                    className="is-flex is-align-items-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedChannels.includes(channel)}
                                                                                        onChange={() => toggleChannelSelection(channel)}
                                                                                        className="mr-2"
                                                                                    />
                                                                                    <img
                                                                                        src={channel.snippet.thumbnails.default.url}
                                                                                        alt={channel.snippet.title}
                                                                                        className="mr-2"
                                                                                        style={{
                                                                                            borderRadius: "50%",
                                                                                            width: "40px",
                                                                                            height: "40px"
                                                                                        }}
                                                                                    />
                                                                                    <a
                                                                                        href={`https://www.youtube.com/channel/${channel.snippet.resourceId.channelId}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                    >
                                                                                        {channel.snippet.title}
                                                                                    </a>
                                                                                </label>
                                                                            </motion.li>
                                                                        ))}
                                                                    </AnimatePresence>
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                {selectedChannels.length !== 0 ? (
                                                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                                                                exit={{opacity: 0}} transition={{duration: 0.3}}
                                                                className="card-footer is-flex is-justify-content-end">
                                                        <motion.div initial={{scale: 0.8, opacity: 0}}
                                                                    animate={{scale: 1, opacity: 1}}
                                                                    transition={{duration: 0.5, ease: "easeInOut"}}
                                                                    className="card-footer-item">
                                                            <button onClick={() => {
                                                                if (mainListRef.current) {
                                                                    mainListRef.current.scrollIntoView({
                                                                        behavior: "smooth",
                                                                        block: "end"
                                                                    });
                                                                }

                                                                setTimeout(() => {
                                                                    setSelectedChannels([]);
                                                                    setVideos([]);
                                                                }, 300);
                                                            }} className="button">Очистити
                                                            </button>
                                                        </motion.div>
                                                        {videos.length === 0 ? (
                                                            <motion.div
                                                                initial={{scale: 0.8, opacity: 0}}
                                                                animate={{scale: 1, opacity: 1}}
                                                                exit={{scale: 0.8, opacity: 0}}
                                                                transition={{duration: 0.5, ease: "easeInOut"}}
                                                                className="card-footer-item"
                                                            >
                                                                <button onClick={fetchVideos}
                                                                        className="button has-background-danger">
                                                                    Далі
                                                                </button>
                                                            </motion.div>
                                                        ) : null}
                                                    </motion.div>
                                                ) : null}
                                            </motion.div>
                                            {videos.length > 0 && (
                                                <motion.div ref={videoListRef} className="card has-background-white mt-4"
                                                            style={{width: '350px'}} initial={{scale: 0.8, opacity: 0}}
                                                            animate={{scale: 1, opacity: 1}}
                                                            transition={{duration: 0.5, ease: "easeInOut"}}>
                                                    <header className="card-header">
                                                        <p className="card-header-title">Налаштування пошуку</p>
                                                    </header>
                                                    <div style={{height: '320px'}}
                                                         className="card-content is-grid is-justify-content-space-between">
                                                        <div>
                                                            <p>Всього відео для сортування: {videos.length}</p>
                                                        </div>
                                                        <div className="is-grid is-align-items-self-end">
                                                            <div>
                                                                <p>Категорії для пошуку:</p>
                                                                <Select
                                                                    placeholder="Виберіть категорію(ї):"
                                                                    closeMenuOnSelect={false}
                                                                    components={animatedComponents}
                                                                    isMulti
                                                                    options={categoriesOfVideo}
                                                                    onChange={(selected) => {
                                                                        setSelectedOptions(selected);
                                                                    }}
                                                                    value={selectedOptions}
                                                                    onInputChange={(newValue) => setInputValue(newValue)}
                                                                    onMenuClose={() => {
                                                                        setMenuIsOpen(false);
                                                                    }}
                                                                    onMenuOpen={() => {
                                                                        setMenuIsOpen(true);
                                                                    }}
                                                                    menuIsOpen={menuIsOpen}
                                                                    onFocus={() => setMenuIsOpen(true)}
                                                                    className="basic-multi-select"
                                                                    classNamePrefix="select"
                                                                    inputValue={inputValue}
                                                                    noOptionsMessage={() => "Нічого не знайдено 😔"}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="card-footer-item">
                                                            <div className="card-footer-item">
                                                                <button onClick={fetchResponse}
                                                                        className="button has-background-danger">Пошук
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ) :
                                    <AnimatePresence>
                                        {isFetching ? (
                                                <motion.div
                                                    initial={{scale: 0.8, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    exit={{scale: 0.8, opacity: 0}} // Додаємо анімацію виходу
                                                    transition={{duration: 0.5, ease: "easeInOut"}}
                                                >
                                                    <Atom color="red" size="medium" text="" textColor=""/>
                                                </motion.div>
                                            )
                                            :
                                            <div className="container">
                                                <div>
                                                    {Object.keys(sortedVideos).map(category => (
                                                        <motion.div key={category} className="card has-background-white"
                                                                    style={{width: '350px'}}
                                                                    initial={{scale: 0.8, opacity: 0}}
                                                                    animate={{scale: 1, opacity: 1}}
                                                                    transition={{duration: 0.5, ease: "easeInOut"}}
                                                        >
                                                            <header className="card-header">
                                                                <p className="card-header-title">{category}</p>
                                                            </header>

                                                            {sortedVideos[category] && sortedVideos[category].length > 0 ? (
                                                                <div
                                                                    className="list has-visible-pointer-controls p-5 is-flex"
                                                                    style={{
                                                                        flexWrap: 'wrap',
                                                                        height: '360px',
                                                                        overflow: 'auto'
                                                                    }}
                                                                >
                                                                    {sortedVideos[category].map((video, index) => (
                                                                        <div key={index}
                                                                             className="list-item"
                                                                             style={{
                                                                                 width: '50%',
                                                                                 boxSizing: 'border-box',
                                                                                 padding: '0.25rem'
                                                                             }}
                                                                        >
                                                                            <div
                                                                                className="is-flex is-justify-content-center">
                                                                                <a href={video.link} target="_blank"
                                                                                   rel="noopener noreferrer">
                                                                                    <div className="list-item-image">
                                                                                        <figure style={{
                                                                                            height: '106px',
                                                                                            width: '140px'
                                                                                        }} className="image">
                                                                                            <img alt={video.title}
                                                                                                 src={video.image}/>
                                                                                        </figure>
                                                                                    </div>
                                                                                    <div className="list-item-content">
                                                                                        <p className="is-size-7 has-text-grey">
                                                                                            {video.title.length > 20 ? video.title.slice(0, 18) + "..." : video.title}
                                                                                        </p>
                                                                                    </div>
                                                                                </a>
                                                                            </div>
                                                                            <a className="is-size-7"
                                                                               href={video.linkChannel}>{video.nameChannel}</a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 has-text-centered">
                                                                    <p>У цій категорії немає відео.</p>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                    <motion.div className="is-flex is-justify-content-center"
                                                                initial={{scale: 0.8, opacity: 0}}
                                                                animate={{scale: 1, opacity: 1}}
                                                                transition={{duration: 0.5, ease: "easeInOut"}}>
                                                        <button onClick={() => {
                                                            setNextPage(false);
                                                            setVideos([]);
                                                            setSelectedChannels([]);
                                                            setSelectedOptions([0])
                                                        }} className="button has-background-danger">
                                                            Завершити
                                                        </button>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        }
                                    </AnimatePresence>
                                }
                            </AnimatePresence>
                        ) : (
                            <AuthCard/>
                        )}
                    </div>
                ) : <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.5}} className="is-flex is-justify-content-center pt-6"><ThreeDot color="red" size="large" text="" textColor=""/>
                </motion.div>}
            </div>
        </motion.main>
    );
}