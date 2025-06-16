import React, { useState } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState('login')
    const [isAdmin, setIsAdmin] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (mode === 'login') {
                const res = await axios.post('http://localhost:8000/api/login', 
                    `username=${username}&password=${password}`, 
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                )
                
                const token = res.data.access_token
                const userRes = await axios.get('http://localhost:8000/api/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })

                dispatch(loginSuccess({ 
                    token, 
                    user: userRes.data 
                }))
                navigate('/')
            } else {
                await axios.post('http://localhost:8000/api/register', { 
                    username, 
                    password, 
                    role: isAdmin ? 'admin' : 'user'
                })
                alert('Регистрация успешна! Теперь можно войти.')
                setMode('login')
            }
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.detail || err.message))
            console.error(err)
        }
    }

    return (
        <div className="login-container">
            <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Имя пользователя"
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Пароль"
                        required
                    />
                </div>
                {mode === 'register' && (
                    <div className="form-group admin-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={e => setIsAdmin(e.target.checked)}
                            />
                            Зарегистрировать как администратора
                        </label>
                    </div>
                )}
                <button type="submit" className="btn">
                    {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </form>
            <p 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="toggle-mode"
            >
                {mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти'}
            </p>
        </div>
    )
}

export default LoginPage