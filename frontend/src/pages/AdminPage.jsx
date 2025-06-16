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

    useEffect(() => {
        if (!auth.token || auth.user?.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const [ordersRes, usersRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/admin/orders', {
                        headers: { Authorization: `Bearer ${auth.token}` }
                    }),
                    axios.get('http://localhost:8000/api/admin/users', {
                        headers: { Authorization: `Bearer ${auth.token}` }
                    })
                ]);
                setOrders(ordersRes.data);
                setUsers(usersRes.data);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [auth.token, auth.user, navigate]);

    const formatMoscowTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="admin-loading">Загрузка данных...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Панель администратора</h1>
                <div className="admin-stats">
                    <div className="stat-card">
                        <span className="stat-value">{orders.length}</span>
                        <span className="stat-label">Заказов</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">Пользователей</span>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                <section className="orders-section">
                    <h2>Управление заказами</h2>
                    <div className="table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Пользователь</th>
                                    <th>Дата</th>
                                    <th>Статус</th>
                                    <th>Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{order.user_id}</td>
                                        <td>{formatMoscowTime(order.created_at)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{order.total?.toLocaleString() || 0} ₽</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="users-section">
                    <h2>Управление пользователями</h2>
                    <div className="table-container">
                        <table className="users-table">
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
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminPage;