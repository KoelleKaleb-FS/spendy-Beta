import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import styles from '../styles/Navigation.module.css';

function Navigation() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLinks}>
        <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : '')}>
          Home
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink to="/budget-overview" className={({ isActive }) => (isActive ? styles.active : '')}>
              Budget Overview
            </NavLink>

            {/* Added Manage Budget Link */}
            <NavLink to="/BudgetManager" className={({ isActive }) => (isActive ? styles.active : '')}>
              Manage Budget
            </NavLink>
          </>
        )}
      </div>

      {isAuthenticated && (
        <span className={styles.userGreeting}>
          Hello, {user?.name || user?.email}
        </span>
      )}

      <div className={styles.authGroup}>
        {!isAuthenticated ? (
          <button onClick={() => loginWithRedirect()} className={styles.linkButton}>
            Login
          </button>
        ) : (
          <button onClick={() => logout({ returnTo: window.location.origin })} className={styles.linkButton}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
