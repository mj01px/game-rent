import { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import { Game } from './types'
import { getGames } from './services/api'
import Sidebar from './components/Sidebar/Sidebar'
import TopBar from './components/TopBar/TopBar'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import FeaturedGames from './pages/FeaturedGames/FeaturedGames'
import Favorites from './pages/Favorites/Favorites'
import MyGames from './pages/MyGames/MyGames'
import NewReleases from './pages/NewReleases/NewReleases'
import Cart from './pages/Cart/Cart'
import GameDetail from './pages/GameDetail/GameDetail'
import PublisherPage from './pages/PublisherPage/PublisherPage'
import Login from './pages/Login/Login'
import Checkout from './pages/Checkout/Checkout'
import Confirmation from './pages/Confirmation/Confirmation'
import Profile from './pages/Profile/Profile'
import ConfirmChange from './pages/ConfirmChange/ConfirmChange'
import AdminPortal from './pages/AdminPortal/AdminPortal'
import React from 'react'

function AppContent() {
    const [page, setPage] = useState('home')
    const [prevPage, setPrevPage] = useState('home')
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)
    const [allGames, setAllGames] = useState<Game[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPublisher, setSelectedPublisher] = useState<{ id: number, name: string } | null>(null)
    const [confirmedRentals, setConfirmedRentals] = useState<any[]>([])

    const [confirmToken, setConfirmToken] = useState<string | null>(null)
    const [confirmType, setConfirmType] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const type = params.get('type')
        if (token && type) {
            setConfirmToken(token)
            setConfirmType(type)
            setPage('confirm-change')
        }
    }, [])

    useEffect(() => {
        getGames()
            .then(({ data }) => setAllGames(data))
            .catch(console.error)
    }, [])

    const goToGame = (game: Game) => {
        setPrevPage(page)
        setSelectedGame(game)
        setPage('gamedetail')
    }

    const goToPublisher = (id: number, name: string) => {
        setPrevPage(page)
        setSelectedPublisher({ id, name })
        setPage('publisher')
    }

    const goBack = () => {
        setPage(prevPage)
        setSelectedGame(null)
        setSelectedPublisher(null)
    }

    const handleSearch = (q: string) => {
        setSearchQuery(q)
        if (q.length > 0) setPage('catalog')
    }

    if (page === 'login') {
        return <Login setPage={setPage} />
    }

    if (page === 'confirm-change' && confirmToken && confirmType) {
        return (
            <ConfirmChange
                token={confirmToken}
                type={confirmType}
                setPage={setPage}
            />
        )
    }

    const renderPage = () => {
        switch (page) {
            case 'home':
                return (
                    <Home
                        setPage={setPage}
                        setSelectedGame={goToGame}
                        onPublisher={goToPublisher}
                    />
                )
            case 'admin':
                return <AdminPortal setPage={setPage} />
            case 'catalog':
                return <Catalog setSelectedGame={goToGame} initialSearch={searchQuery} />
            case 'featured':
                return <FeaturedGames setSelectedGame={goToGame} setPage={setPage} />
            case 'favorites':
                return <Favorites setSelectedGame={goToGame} allGames={allGames} setPage={setPage} />
            case 'mygames':
                return <MyGames setPage={setPage} />
            case 'newreleases':
                return <NewReleases setSelectedGame={goToGame} allGames={allGames} />
            case 'cart':
                return <Cart setPage={setPage} />
            case 'checkout':
                return <Checkout setPage={setPage} onConfirmation={(rentals) => { setConfirmedRentals(rentals); setPage('confirmation') }} />
            case 'confirmation':
                return <Confirmation rentals={confirmedRentals} setPage={setPage} />

            case 'profile':
                return <Profile setPage={setPage} />
            case 'gamedetail':
                return selectedGame
                    ? <GameDetail
                        game={selectedGame}
                        onBack={goBack}
                        setPage={setPage}
                        setSelectedGame={goToGame}
                        allGames={allGames}
                    />
                    : null
            case 'publisher':
                return selectedPublisher
                    ? <PublisherPage
                        publisherId={selectedPublisher.id}
                        publisherName={selectedPublisher.name}
                        setSelectedGame={goToGame}
                        onBack={goBack}
                    />
                    : null
            default:
                return <Home setPage={setPage} setSelectedGame={goToGame} onPublisher={goToPublisher} />
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar page={page} setPage={setPage} onSearch={handleSearch} />
            <Sidebar page={page} setPage={setPage} />
            <main style={{
                marginLeft: '88px',
                paddingTop: '112px',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingBottom: '24px',
                minHeight: '100vh',
            }}>
                {renderPage()}
            </main>
        </div>
    )
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    )
}
