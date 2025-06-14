import React, { useState } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState('login')

    const handle = async () => {
        try {
            if (mode === 'login') {
                const res = await axios.post('/api/token', new URLSearchParams({
                    username,
                    password,
                    grant_type: 'password'
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                
                const token = res.data.access_token
                const userRes = await axios.get('/api/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })

                dispatch(loginSuccess({ 
                    token, 
                    user: userRes.data 
                }))
                navigate('/')
            } else {
                await axios.post('/api/register', { 
                    username, 
                    password, 
                    role: 'user' 
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
        <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
            <div style={{ marginBottom: '10px' }}>
                <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Имя пользователя" 
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Пароль" 
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>
            <button 
                onClick={handle}
                style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}
            >
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
            <p 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
                style={{ cursor: 'pointer', color: 'blue', textAlign: 'center', marginTop: '10px' }}
            >
                {mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти'}
            </p>
        </div>
    )
}

export default LoginPage
