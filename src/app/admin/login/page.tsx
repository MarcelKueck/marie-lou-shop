import styles from '../admin.module.css';

export default function AdminLoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.subtitle}>Sign in to access the admin dashboard</p>
        <form className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" />
          </div>
          <button type="submit" className={styles.submitButton}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
