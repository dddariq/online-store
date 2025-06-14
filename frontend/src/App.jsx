import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout } from './features/auth/authSlice';
import axios from 'axios';
import './index.css';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';

function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(state => state.auth);
  const [products] = useState([
    { id: 1, name: 'Беспроводная электрическая зубная щетка', price: 4590, description: 'С 3 режимами чистки и bluetooth', image_url: '/images/products/toothbrush.jpg' },
    { id: 2, name: 'Умный горшок для растений', price: 3290, description: 'Автополив и контроль влажности почвы', image_url: '/images/products/smart_pot.jpg' },
    { id: 3, name: 'Лазерный проектор звездного неба', price: 7890, description: 'Проекция 360° с управлением через приложение', image_url: '/images/products/star_projector.jpg' },
    { id: 4, name: 'Персональный мини-холодильник', price: 5990, description: 'Для напитков на рабочем столе (6 банок)', image_url: '/images/products/mini_fridge.jpg' },
    { id: 5, name: 'Говорящий кактус', price: 1990, description: '100+ фраз, датчик движения, USB-зарядка', image_url: '/images/products/talking_cactus.jpg' },
    { id: 6, name: 'Набор для выращивания трюфелей', price: 8990, description: 'Домашняя грибница с подробной инструкцией', image_url: '/images/products/truffle_kit.jpg' },
    { id: 7, name: 'USB-подогреватель для чашки', price: 1290, description: 'Поддерживает температуру 55-65°C', image_url: '/images/products/cup_warmer.jpg' },
    { id: 8, name: 'Ручной массажер для питомцев', price: 1590, description: 'С вибрацией и мягкими щетинками', image_url: '/images/products/pet_massager.jpg' },
    { id: 9, name: 'Мини-пылесос для клавиатуры', price: 890, description: 'USB-питание, 2 насадки', image_url: '/images/products/keyboard_vacuum.jpg' },
    { id: 10, name: 'Беспроводной нагреватель для кружки', price: 3490, description: 'Работает от powerbank, 3 температуры', image_url: '/images/products/wireless_warmer.jpg' },
    { id: 11, name: 'Набор для создания парфюма', price: 5990, description: '10 базовых ароматов, пустые флаконы', image_url: '/images/products/perfume_kit.jpg' },
    { id: 12, name: 'Умная винная пробка', price: 2490, description: 'Контроль температуры и свежести вина', image_url: '/images/products/smart_cork.jpg' },
    { id: 13, name: 'Микрофон для караоке в душе', price: 1990, description: 'Водонепроницаемый, bluetooth', image_url: '/images/products/shower_mic.jpg' },
    { id: 14, name: 'Подставка для ноутбука с охлаждением', price: 4590, description: '2 вентилятора, регулируемый угол наклона', image_url: '/images/products/laptop_stand.jpg' },
    { id: 15, name: 'Перчатки для сенсорных экранов', price: 990, description: 'Тонкие, теплые, работают с тачскринами', image_url: '/images/products/touch_gloves.jpg' }
  ]);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (auth.token) {
      loadCart();
    }
  }, [auth.token]);

  const loadCart = async () => {
    try {
      const response = await axios.get('http://localhost:8000/cart', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    }
  };

  const addToCart = async (productId) => {
    if (!auth.token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/cart', {
        product_id: productId,
        quantity: 1
      }, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        await loadCart();
        alert('Товар успешно добавлен в корзину!');
      }
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert('Не удалось добавить товар в корзину');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:8000/cart/${productId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      await loadCart();
    } catch (error) {
      console.error('Ошибка удаления из корзины:', error);
    }
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      alert('Корзина пуста. Добавьте товары перед оформлением заказа.');
      return;
    }

    try {
      await axios.post('http://localhost:8000/orders/checkout', {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      await loadCart();
      alert('Заказ успешно оформлен!');
      setIsCartOpen(false);
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
    }
  };

  const getProductInfo = (productId) => products.find(p => p.id === productId);

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="logo">Интернет-магазин</div>
          <nav className="nav">
            {auth.token ? (
              <>
                <span>Здравствуйте, {auth.user.username}</span>
                <button className="btn" onClick={() => setIsCartOpen(true)}>
                  Корзина ({cartItems.length})
                </button>
                <button className="btn" onClick={() => navigate('/profile')}>
                  Профиль
                </button>
                {auth.user.role === 'admin' && (
                  <button 
                    className="btn" 
                    onClick={() => navigate('/admin')}
                    style={{ backgroundColor: '#e74c3c' }}
                  >
                    Админ-панель
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => dispatch(logout())}>
                  Выйти
                </button>
              </>
            ) : (
              <button className="btn" onClick={() => navigate('/login')}>
                Войти
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        <h1 style={{ margin: '30px 0 20px' }}>Каталог товаров</h1>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image"
                />
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-price">{product.price.toLocaleString()} ₽</p>
                <p className="product-description">{product.description}</p>
                <button className="btn" onClick={() => addToCart(product.id)}>
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className={`overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Ваша корзина</h2>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>×</button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Корзина пуста</p>
          ) : (
            cartItems.map(item => {
              const product = getProductInfo(item.product_id);
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image-container">
                    <img
                      src={product?.image_url || 'https://via.placeholder.com/60?text=Товар'}
                      alt={product?.name || ''}
                      className="cart-item-image"
                    />
                  </div>
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{product?.name || 'Товар'}</h4>
                    <p className="cart-item-price">
                      {(product?.price || 0).toLocaleString()} ₽
                    </p>
                    <p className="cart-item-quantity">x {item.quantity}</p>
                    <button className="btn btn-danger" onClick={() => removeFromCart(item.product_id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-total">
          Итого: {cartItems.reduce((sum, item) => {
            const product = getProductInfo(item.product_id);
            return sum + (product?.price || 0) * item.quantity;
          }, 0).toLocaleString()} ₽
        </div>

        <button className="btn checkout-btn" onClick={checkout}>
          Оформить заказ
        </button>
      </div>
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      dispatch(loginSuccess({ token, user }));
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={auth.token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/profile" element={auth.token ? <UserPage /> : <Navigate to="/login" replace />} />
        <Route 
          path="/admin" 
          element={auth.token && auth.user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;