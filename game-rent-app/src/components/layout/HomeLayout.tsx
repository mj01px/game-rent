import { Outlet } from 'react-router-dom'
import HomeTopBar from './HomeTopBar'

export default function HomeLayout() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <HomeTopBar />
            <main style={{ paddingTop: '88px' }}>
                <Outlet />
            </main>
        </div>
    )
}
