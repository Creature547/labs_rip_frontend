import { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import type { Equipment } from '../api/generated/Api'
import defaultImage from '../assets/default-equipment.png'
import defaultVideo from '../assets/default-video.svg'

const price = (cost: number) =>
  new Intl.NumberFormat('ru-RU').format(cost) + ' ₽'

function TileImage({ service }: { service: Equipment }) {
  const [failed, setFailed] = useState(false)

  return (
    <Card.Img
      className="tile-image"
      variant="top"
      src={!failed && service.image_url ? service.image_url : defaultImage}
      alt={service.name}
      onError={() => setFailed(true)}
    />
  )
}

function FeedMedia({ service }: { service: Equipment }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  if (!service.video_url || videoFailed) {
    return (
      <img
        className="feed-media"
        src={!imageFailed && service.image_url ? service.image_url : defaultVideo}
        alt={service.name}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <video
      className="feed-media"
      src={service.video_url}
      poster={service.image_url || defaultVideo}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setVideoFailed(true)}
    />
  )
}

export function TileCard({
  service,
  onDelete,
}: {
  service: Equipment
  onDelete?: () => void
}) {
  return (
    <Card className="tile-card h-100 position-relative">
      <TileImage service={service} />

      <Card.Body className="tile-overlay d-flex flex-column">
        <Card.Title>{service.name}</Card.Title>

        <div className="tile-details mt-auto">
          <span>{service.power} кВт</span>
          <span>{price(service.cost)}</span>
        </div>

        {onDelete && <button className="delete-tile" onClick={onDelete} aria-label={`Удалить ${service.name}`}>Удалить</button>}
        <span className="tile-like">♥ {service.likes_count}</span>
      </Card.Body>
    </Card>
  )
}

export function FeedCard({
  service,
  onLike,
  onNext,
}: {
  service: Equipment
  onLike?: () => void
  onNext: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const short =
    service.description.length > 72
      ? service.description.slice(0, 72) + '…'
      : service.description

  return (
    <section className="feed-card">
      <FeedMedia service={service} />
      <div className="feed-shade" />

      <div className="feed-content">
        <div className="feed-heading">
          <h1>{service.name}</h1>
        </div>

        <div className="feed-info">
          <span>
            Мощность
            <b>{service.power} кВт</b>
          </span>

          <span>
            Стоимость
            <b>{price(service.cost)}</b>
          </span>

          {onLike ? <button className="feed-like" aria-label="Нравится" aria-pressed={Boolean(service.liked)} onClick={onLike}>
            {service.liked ? '♥' : '♡'} <span>{service.likes_count}</span>
          </button> : <span className="feed-like">♥ <span>{service.likes_count}</span></span>}
        </div>

        <p>
          {expanded ? service.description : short}{' '}
          {service.description.length > 72 && (
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? 'свернуть' : 'ещё'}
            </button>
          )}
        </p>

        <Button
          className="next-round"
          onClick={onNext}
          aria-label="Следующая услуга"
        >
          →
        </Button>
      </div>
    </section>
  )
}

