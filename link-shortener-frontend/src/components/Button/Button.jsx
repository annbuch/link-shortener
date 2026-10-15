import styles from './Button.module.css'

// Базовая кнопка. variant: primary | danger | ghost | default(по умолчанию).
// size: sm | icon | iconSm | md(по умолчанию).
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
