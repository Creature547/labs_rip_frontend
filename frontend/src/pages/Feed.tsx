import { Button, Container } from 'react-bootstrap'
import { FeedCard } from '../components/EquipmentCards'
import { likeHeatingEquipment, loadHeatingFeed } from '../state/equipment'
import { useAppDispatch, useAppSelector } from '../state/store'

export function Feed() {
  const dispatch = useAppDispatch()
  const login = useAppSelector(state => state.auth.login)
  const { feed, feedPosition, pending, error } = useAppSelector(state => state.heatingEquipment)
  return <Container className="feed-container">
    {feed ? <FeedCard key={feed.id} service={feed}
      onNext={() => dispatch(loadHeatingFeed({ position: feedPosition + 1, after: feed.id }))}
      onLike={login ? () => dispatch(likeHeatingEquipment(feed)) : undefined} />
      : !pending && <div className="empty-feed">
        <p>{error ? 'Не удалось загрузить ленту.' : 'Опубликованных приборов пока нет.'}</p>
        <Button onClick={() => dispatch(loadHeatingFeed({ position: 1 }))}>Обновить</Button>
      </div>}
  </Container>
}
