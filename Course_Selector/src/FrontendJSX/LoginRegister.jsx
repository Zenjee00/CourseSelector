import '../FrontendCSS/LoginRegister.css';

import { useState } from 'react';

function LoginRegister() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isLogin) {
            // Login logic
            console.log('Login:', { email, password });
            // Add your login logic here (e.g., Firebase authentication)
        } else {
            // Register logic
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            console.log('Register:', { email, password });
            // Add your register logic here (e.g., Firebase authentication)
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
    };

    return (
        <div className="login-register-container">
            <div className="form-wrapper">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>
                
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="showPassword"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        <label htmlFor="showPassword">Show Password</label>
                    </div>

                    <button type="submit" className="submit-btn">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <div className="toggle-mode">
                    <p>
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <span onClick={toggleMode} className="toggle-link">
                            {isLogin ? 'Register' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginRegister;