import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const AdminPage = () => {
    const auth = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auth.token || auth.user?.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [ordersRes, usersRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/admin/orders', {
                        headers: { 
                            Authorization: `Bearer ${auth.token}`,
                            'Accept': 'application/json'
                        }
                    }),
                    axios.get('http://localhost:8000/api/admin/users', {
                        headers: { 
                            Authorization: `Bearer ${auth.token}`,
                            'Accept': 'application/json'
                        }
                    })
                ]);

                if (ordersRes.data && Array.isArray(ordersRes.data)) {
                    setOrders(ordersRes.data);
                } else {
                    setOrders([]);
                }

                if (usersRes.data && Array.isArray(usersRes.data)) {
                    setUsers(usersRes.data);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setError('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [auth.token, auth.user, navigate]);

    const formatMoscowTime = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="admin-page">Загрузка...</div>;
    }

    if (error) {
        return <div className="admin-page error">{error}</div>;
    }

    return (
        <div className="admin-page">
            <div className="header-strip"></div>
            <h1>Административная панель</h1>
            
            <section className="admin-section">
                <h2>Все заказы</h2>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Пользователь</th>
                                <th>Дата</th>
                                <th>Статус</th>
                                <th>Товары</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.user_id}</td>
                                    <td>{formatMoscowTime(order.created_at)}</td>
                                    <td>{order.status}</td>
                                    <td>
                                        {order.products?.map(p => p.name).join(', ') || 'Нет товаров'}
                                    </td>
                                    <td>
                                        {order.products?.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()} ₽
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-section">
                <h2>Пользователи</h2>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Логин</th>
                                <th>Роль</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminPage;