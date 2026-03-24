import { createBrowserRouter } from 'react-router-dom'
import HomeLayout from '../components/layout/HomeLayout'
import InnerLayout from '../components/layout/InnerLayout'
import Home from '../pages/Home/Home'
import Catalog from '../pages/Catalog/Catalog'
import GameDetail from '../pages/GameDetail/GameDetail'
import PublisherPage from '../pages/PublisherPage/PublisherPage'
import Cart from '../pages/Cart/Cart'
import Checkout from '../pages/Checkout/Checkout'
import Confirmation from '../pages/Confirmation/Confirmation'
import Profile from '../pages/Profile/Profile'
import MyGames from '../pages/MyGames/MyGames'
import Favorites from '../pages/Favorites/Favorites'
import Login from '../pages/Login/Login'
import ConfirmChange from '../pages/ConfirmChange/ConfirmChange'
import AdminPortal from '../pages/AdminPortal/AdminPortal'

const router = createBrowserRouter([
    // Homepage — floating pill topbar, full-width hero
    {
        path: '/',
        element: <HomeLayout />,
        children: [
            { index: true, element: <Home /> },
        ],
    },
    // All inner pages — same floating pill topbar + centered content container
    {
        path: '/',
        element: <InnerLayout />,
        children: [
            { path: 'catalog',          element: <Catalog /> },
            { path: 'game/:id',         element: <GameDetail /> },
            { path: 'publisher/:id',    element: <PublisherPage /> },
            { path: 'cart',             element: <Cart /> },
            { path: 'checkout',         element: <Checkout /> },
            { path: 'confirmation',     element: <Confirmation /> },
            { path: 'profile',          element: <Profile /> },
            { path: 'my-games',         element: <MyGames /> },
            { path: 'favorites',        element: <Favorites /> },
            { path: 'admin',            element: <AdminPortal /> },
        ],
    },
    // Standalone pages — no topbar/nav
    { path: '/login',           element: <Login /> },
    { path: '/confirm-change',  element: <ConfirmChange /> },
])

export default router
