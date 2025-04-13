'use client';
import Link from "next/link";
import {usePathname} from "next/navigation";
import Image from "next/image";

export default function Footer() {
    const pathname = usePathname();

    return (
        <footer className="has-background-light" style={{borderTop: '1px solid black'}}>
            <div className="container has-text-centered px-0">
                <div className="pt-2 px-2 is-flex is-justify-content-center is-align-items-center">
                    <Link href="/" className='is-flex is-align-items-center pr-6'>
                        <b className="has-text-dark pr-1">YoutubePlus</b>
                        <Image src="/img/logo.png" alt="Logo" width={45} height={35}/>
                    </Link>
                    <nav className="is-justify-content-center is-flex is-gap-3">
                        <Link href="/" style={{color: pathname === '/' ? 'red' : 'black'}}>
                            Головна
                        </Link>
                        <Link href="/search" style={{color: pathname === '/search' ? 'red' : 'black'}}>
                            Пошук
                        </Link>
                        <Link href="/history" style={{color: pathname === '/history' ? 'red' : 'black'}}>
                            Історія
                        </Link>
                    </nav>
                </div>
                <div className="p-2">
                    <span>
                        <span className="has-text-dark">©{new Date().getFullYear()} Додаток розробив</span>
                        <a className="pl-2" href='https://github.com/AndriiChornopyskyi2002'>
                            Андрій Чорнописький
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
