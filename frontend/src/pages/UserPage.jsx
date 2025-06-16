import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserPage.css";

const UserPage = () => {
    const auth = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.token) {
            navigate('/login');
            return;
        }

        const loadOrders = async () => {
            try {
                const { data } = await axios.get('http://localhost:8000/api/orders', {
                    headers: { Authorization: `Bearer ${auth.token}` }
                });
                setOrders(data);
            } catch (error) {
                console.error("Ошибка загрузки заказов:", error);
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [auth.token, navigate]);

    const formatMoscowTime = (dateString) => {
    const date = new Date(dateString);
    const moscowOffset = 3 * 60 * 60 * 1000; // MSK (UTC+3)
    const moscowTime = new Date(date.getTime() + moscowOffset);
    
    return moscowTime.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

    if (loading) return <div className="user-loading">Загрузка истории заказов...</div>;

    return (
        <div className="user-page-container">
            <div className="user-header">
                <h1>Личный кабинет</h1>
                <div className="user-info-card">
                    <div className="user-info-item">
                        <span className="info-label">Логин:</span>
                        <span className="info-value">{auth.user.username}</span>
                    </div>
                    <div className="user-info-item">
                        <span className="info-label">Роль:</span>
                        <span className={`role-badge ${auth.user.role}`}>
                            {auth.user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="orders-section">
                <h2>История заказов</h2>
                
                {orders.length === 0 ? (
                    <div className="no-orders-message">
                        У вас пока нет завершенных заказов
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <span className="order-number">Заказ #{order.id}</span>
                                    <span className="order-date">
                                        {formatMoscowTime(order.created_at)}
                                    </span>
                                    <span className={`order-status ${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="order-summary">
                                    <span className="total-label">Итого:</span>
                                    <span className="total-amount">{order.total?.toLocaleString() || 0} ₽</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPage;