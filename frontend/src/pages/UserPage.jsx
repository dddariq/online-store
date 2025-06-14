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
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auth.token) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8000/api/orders', {
                    headers: { 
                        Authorization: `Bearer ${auth.token}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    setOrders(response.data);
                } else {
                    setOrders([]);
                    console.error('Invalid orders data format:', response.data);
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                setError('Не удалось загрузить заказы');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [auth.token, navigate]);

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
        return <div className="user-page">Загрузка...</div>;
    }

    if (error) {
        return <div className="user-page error">{error}</div>;
    }

    return (
        <div className="user-page">
            <div className="user-header">
                <div className="header-strip"></div>
                <h1>Личный кабинет</h1>
                <div className="user-info">
                    <div className="info-item">
                        <span className="info-label">Логин:</span>
                        <span className="info-value">{auth.user.username}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Роль:</span>
                        <span className="info-value">{auth.user.role}</span>
                    </div>
                </div>
            </div>

            <div className="orders-section">
                <h2>История заказов</h2>
                {orders.length === 0 ? (
                    <p className="no-orders">У вас пока нет заказов</p>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <span className="order-id">Заказ #{order.id}</span>
                                    <span className="order-date">{formatMoscowTime(order.created_at)}</span>
                                    <span className={`order-status ${order.status.toLowerCase().replace(' ', '-')}`}>
                                        {order.status}
                                    </span>
                                </div>
                                
                                <div className="order-products">
                                    <h4>Товары:</h4>
                                    <ul>
                                        {order.products?.map(product => (
                                            <li key={product.id}>
                                                <div className="product-item">
                                                    <img 
                                                        src={product.image_url || '/images/default-product.jpg'} 
                                                        alt={product.name} 
                                                        className="product-thumbnail"
                                                    />
                                                    <div className="product-info">
                                                        <span className="product-name">{product.name}</span>
                                                        <span className="product-price">{product.price?.toLocaleString() || '0'} ₽</span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="order-footer">
                                    <div className="order-total">
                                        Итого: {order.products?.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()} ₽
                                    </div>
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