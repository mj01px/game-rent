import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <RouterProvider router={router} />
                    </FavoritesProvider>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>
)
