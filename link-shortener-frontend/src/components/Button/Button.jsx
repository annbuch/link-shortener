import styles from './Button.module.css'

export function Button({ variant = 'default', size = 'md', className = '', ...props }) {
  const classes = [
    styles.btn,
    variant !== 'default' ? styles[variant] : '',
    size !== 'md' ? styles[size] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type="button" className={classes} {...props} />
}
