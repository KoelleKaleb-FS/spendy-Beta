import React from 'react';
import styles from '../styles/Homepage.module.css';

function Homepage() {
  return (
    <div className={styles.container}>
      <img src="/Spendylogo.jpg" alt="Spendy Logo" className={styles.logo} />
      <h1 className={styles.title}>Welcome to Spendy</h1>
      <p className={styles.tagline}>
        Your smart and simple way to manage your finances.
      </p>

      <div className={styles.features}>
        <h2>Why Choose Spendy?</h2>
          <ul>
            <li>Track your expenses effortlessly.</li>
            <li>Set and achieve your financial goals.</li>
            <li>Stay on top of your budget anywhere, anytime.</li>
          </ul>
      </div>

      <button className={styles.button} onClick={() => alert('Let’s get started!')}>
        Get Started
      </button>

      <div className={styles.testimonials}>
        <p>"Spendy has changed the way I manage my money!"</p>
        <p>- Happy Customer</p>
      </div>

    </div>
  );
}

export default Homepage;
