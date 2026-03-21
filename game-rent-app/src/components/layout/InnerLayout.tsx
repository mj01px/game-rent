import { Outlet } from 'react-router-dom'
import HomeTopBar from './HomeTopBar'

export default function InnerLayout() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <HomeTopBar />
            <main style={{ paddingTop: '88px' }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '40px 40px 80px',
                }}>
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
