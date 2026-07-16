import { Link } from 'react-router-dom'

export default function Card({
  image,
  emoji = '💪',
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  to,
  dragging = false,
  innerRef,
}) {
  const inner = (
    <>
      {image ? (
        <img className="card__media" src={image} alt="" loading="lazy" />
      ) : (
        <span className="card__media">{emoji}</span>
      )}
      <div className="card__info">
        <span className="card__title">{title}</span>
        {subtitle != null && <div className="card__subtitle">{subtitle}</div>}
      </div>
    </>
  )

  let main
  if (to) {
    main = <Link to={to} className="card__main">{inner}</Link>
  } else if (onClick) {
    main = <button type="button" className="card__main" onClick={onClick}>{inner}</button>
  } else {
    main = <div className="card__main card__main--static">{inner}</div>
  }

  return (
    <div className={`card${dragging ? ' card--dragging' : ''}`} ref={innerRef}>
      {leading}
      {main}
      {trailing}
    </div>
  )
}
